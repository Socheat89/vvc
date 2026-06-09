export const PUBLIC_ASSET_BASE = 'https://vvc.asia/backend/public';
export const VIDEO_MEDIA_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v']);

export const extractUploadPath = (value) => {
  const normalizedValue = String(value || '').trim().replace(/\\/g, '/');
  const uploadIndex = normalizedValue.toLowerCase().indexOf('uploads/');

  if (uploadIndex < 0) {
    return '';
  }

  return normalizedValue.slice(uploadIndex).replace(/^\/+/, '');
};

export const getUploadImageUrl = (image, folder = '') => {
  if (!image) return '';
  const rawImage = String(image).trim().replace(/\\/g, '/');
  if (!rawImage) return '';
  if (/^(data:|blob:)/i.test(rawImage)) return rawImage;

  const uploadPath = extractUploadPath(rawImage);
  if (uploadPath) {
    return `${PUBLIC_ASSET_BASE}/${uploadPath}`;
  }

  if (/^https?:\/\//i.test(rawImage)) {
    return rawImage;
  }

  const imagePath = rawImage
    .replace(/^\/+/, '')
    .replace(/^public\//i, '')
    .replace(/^backend\/public\//i, '')
    .replace(/^uploads\//i, '');

  const uploadFolder = folder ? `/uploads/${folder}` : '/uploads';
  return `${PUBLIC_ASSET_BASE}${uploadFolder}/${imagePath}`;
};

export const getSiteLogoUrl = (logo) => getUploadImageUrl(logo, 'settings');
export const getBannerMediaUrl = (media) => getUploadImageUrl(media, 'banners');

export const getMediaTypeFromUrl = (media) => {
  if (!media) return 'image';

  const rawMedia = String(media).trim().replace(/\\/g, '/');
  if (/^data:video\//i.test(rawMedia)) return 'video';
  if (/^data:image\//i.test(rawMedia)) return 'image';

  const mediaPath = rawMedia.split(/[?#]/)[0];
  const extension = mediaPath.includes('.')
    ? mediaPath.split('.').pop().toLowerCase()
    : '';

  return VIDEO_MEDIA_EXTENSIONS.has(extension) ? 'video' : 'image';
};

export const isVideoMediaUrl = (media) => getMediaTypeFromUrl(media) === 'video';
