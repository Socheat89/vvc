const MAX_CACHE_SIZE = 48;
const MAX_ACTIVE_REMOVALS = 1;
const PRODUCTION_API_URL = 'https://vvc.asia/backend/public/index.php/api';
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
const MIN_FOREGROUND_RATIO = 0.08;
const MIN_CENTER_FOREGROUND_RATIO = 0.03;

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

const validateTransparentBlob = async (transparentBlob) => {
  const imageBitmap = await createImageBitmap(transparentBlob);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  context.drawImage(imageBitmap, 0, 0);
  imageBitmap.close?.();

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const { width, height } = canvas;
  const centerLeft = Math.floor(width * 0.25);
  const centerRight = Math.ceil(width * 0.75);
  const centerTop = Math.floor(height * 0.2);
  const centerBottom = Math.ceil(height * 0.82);
  let foregroundPixels = 0;
  let centerForegroundPixels = 0;

  for (let offset = 3; offset < data.length; offset += 4) {
    if (data[offset] > 24) {
      foregroundPixels += 1;
    }
  }

  for (let y = centerTop; y < centerBottom; y += 1) {
    for (let x = centerLeft; x < centerRight; x += 1) {
      const offset = ((y * width) + x) * 4;

      if (data[offset + 3] > 24) {
        centerForegroundPixels += 1;
      }
    }
  }

  const foregroundRatio = foregroundPixels / (width * height);
  const centerForegroundRatio = centerForegroundPixels / ((centerRight - centerLeft) * (centerBottom - centerTop));

  if (foregroundRatio < MIN_FOREGROUND_RATIO || centerForegroundRatio < MIN_CENTER_FOREGROUND_RATIO) {
    throw new Error('Background removal removed too much of the product.');
  }

  return transparentBlob;
};

const removeBackgroundSource = async (imageSource) => {
  const { default: removeBackground } = await getBackgroundRemovalModule();
  const transparentBlob = await removeBackground(getImageProcessingSource(imageSource), backgroundRemovalConfig);

  return validateTransparentBlob(transparentBlob);
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
