import React, { useEffect, useMemo, useState } from 'react';
import { createProductPlaceholder } from '../utils/productPlaceholderImage';

export default function ProductImage({
  src,
  alt,
  name,
  category,
  className = '',
  loading = 'lazy',
}) {
  const normalizedSrc = typeof src === 'string' ? src.trim() : '';
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [normalizedSrc]);

  const placeholderSrc = useMemo(
    () => createProductPlaceholder({ name: name || alt, category }),
    [alt, category, name],
  );

  const activeSrc = normalizedSrc && !hasError ? normalizedSrc : placeholderSrc;

  return (
    <img
      src={activeSrc}
      alt={alt || name || 'Product image'}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => {
        if (!hasError) setHasError(true);
      }}
    />
  );
}

