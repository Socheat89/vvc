export const getProductDisplayName = (product, language = 'en') => {
  const localName = String(product?.local_name || '').trim();
  const defaultName = String(product?.name || '').trim();

  if (language === 'kh' && localName) {
    return localName;
  }

  return defaultName || localName;
};

export const getProductSearchText = (product, categoryName = '') => [
  product?.name,
  product?.local_name,
  product?.description,
  product?.brand,
  categoryName,
]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();
