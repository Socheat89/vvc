const MAX_CACHE_SIZE = 48;
const MAX_ACTIVE_REMOVALS = 1;
const PRODUCTION_API_URL = 'https://app.vvc.asia/vvc_web/vvc/backend/public/index.php/api';
const DEV_UPLOAD_PROXY_BASE = '/vvc-upload-proxy';

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
  typeof window !== 'undefined'
);

const toAbsoluteBrowserUrl = (url) => {
  if (/^(?:[a-z+]+:)?\/\//i.test(url) || typeof window === 'undefined') {
    return url;
  }

  return new URL(url, window.location.origin).toString();
};

const extractUploadPath = (imageUrl) => {
  const normalizedUrl = String(imageUrl || '').trim().replace(/\\/g, '/');
  const match = normalizedUrl.match(/uploads\/(?:products|categories|banners)\/[^?#]+/i);

  return match ? match[0] : '';
};

const getImageProcessingSource = (imageUrl) => {
  if (typeof imageUrl !== 'string') {
    return imageUrl;
  }

  const uploadPath = extractUploadPath(imageUrl);

  if (!uploadPath) {
    return imageUrl;
  }

  if (import.meta.env.DEV) {
    return toAbsoluteBrowserUrl(`${DEV_UPLOAD_PROXY_BASE}/${uploadPath}`);
  }

  const apiUrl = (import.meta.env.VITE_API_URL || PRODUCTION_API_URL).replace(/\/+$/, '');

  return toAbsoluteBrowserUrl(`${apiUrl}/image-proxy?path=${encodeURIComponent(uploadPath)}`);
};

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

const removeBackgroundSource = async (imageSource) => {
  const { default: removeBackground } = await getBackgroundRemovalModule();
  return removeBackground(getImageProcessingSource(imageSource), backgroundRemovalConfig);
};

export const getBackgroundRemovedImageBlob = (imageSource) => {
  if (!shouldProcessImage(imageSource)) {
    return Promise.reject(new Error('Background removal is only available in the browser.'));
  }

  return enqueueRemoval(() => removeBackgroundSource(imageSource));
};

export const getBackgroundRemovedImageFile = async (imageSource, filename = 'transparent-product.png') => {
  const transparentBlob = await getBackgroundRemovedImageBlob(imageSource);
  const outputName = filename.replace(/\.[^.]+$/, '') || 'transparent-product';

  return new File([transparentBlob], `${outputName}.png`, { type: 'image/png' });
};

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
    const transparentBlob = await removeBackgroundSource(normalizedUrl);
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
