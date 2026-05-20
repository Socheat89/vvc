const MAX_CACHE_SIZE = 48;
const MAX_ACTIVE_REMOVALS = 1;

const resultCache = new Map();
const promiseCache = new Map();
const removalQueue = [];

let activeRemovals = 0;
let backgroundRemovalModulePromise = null;

const backgroundRemovalConfig = {
  model: 'small',
  output: {
    format: 'image/png',
  },
};

const shouldProcessImage = (imageUrl) => (
  Boolean(imageUrl) &&
  typeof window !== 'undefined' &&
  !/^(blob:|data:)/i.test(String(imageUrl).trim())
);

const trimCache = () => {
  while (resultCache.size > MAX_CACHE_SIZE) {
    const oldestKey = resultCache.keys().next().value;
    const oldestUrl = resultCache.get(oldestKey);

    if (oldestUrl) {
      URL.revokeObjectURL(oldestUrl);
    }

    resultCache.delete(oldestKey);
  }
};

const getBackgroundRemovalModule = async () => {
  if (!backgroundRemovalModulePromise) {
    backgroundRemovalModulePromise = import('@imgly/background-removal');
  }

  return backgroundRemovalModulePromise;
};

const runNextRemoval = () => {
  if (activeRemovals >= MAX_ACTIVE_REMOVALS || removalQueue.length === 0) return;

  const nextTask = removalQueue.shift();
  activeRemovals += 1;

  nextTask()
    .catch(() => {})
    .finally(() => {
      activeRemovals -= 1;
      runNextRemoval();
    });
};

const enqueueRemoval = (task) => new Promise((resolve, reject) => {
  removalQueue.push(async () => {
    try {
      resolve(await task());
    } catch (error) {
      reject(error);
    }
  });

  runNextRemoval();
});

export const getBackgroundRemovedImageUrl = (imageUrl) => {
  const normalizedUrl = String(imageUrl || '').trim();

  if (!shouldProcessImage(normalizedUrl)) {
    return Promise.resolve(normalizedUrl);
  }

  const cachedResult = resultCache.get(normalizedUrl);
  if (cachedResult) {
    return Promise.resolve(cachedResult);
  }

  const cachedPromise = promiseCache.get(normalizedUrl);
  if (cachedPromise) {
    return cachedPromise;
  }

  const removalPromise = enqueueRemoval(async () => {
    const { default: removeBackground } = await getBackgroundRemovalModule();
    const transparentBlob = await removeBackground(normalizedUrl, backgroundRemovalConfig);
    const transparentUrl = URL.createObjectURL(transparentBlob);

    resultCache.set(normalizedUrl, transparentUrl);
    trimCache();

    return transparentUrl;
  }).finally(() => {
    promiseCache.delete(normalizedUrl);
  });

  promiseCache.set(normalizedUrl, removalPromise);

  return removalPromise;
};
