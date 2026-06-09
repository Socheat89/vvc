export const PUBLIC_ASSET_BASE = 'https://vvc.asia/backend/public';

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
