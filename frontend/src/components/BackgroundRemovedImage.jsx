import React, { useEffect, useState } from 'react';
import { getBackgroundRemovedImageUrl } from '../utils/backgroundRemoval';

export default function BackgroundRemovedImage({
  src,
  alt,
  onError,
  className = '',
  autoRemove = false,
  ...imageProps
}) {
  const [displaySrc, setDisplaySrc] = useState(src || '');

  useEffect(() => {
    let isCurrent = true;
    const originalSrc = src || '';

    setDisplaySrc(originalSrc);

    if (!originalSrc || !autoRemove) {
      return () => {
        isCurrent = false;
      };
    }

    getBackgroundRemovedImageUrl(originalSrc)
      .then((transparentSrc) => {
        if (isCurrent && transparentSrc) {
          setDisplaySrc(transparentSrc);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setDisplaySrc(originalSrc);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [autoRemove, src]);

  const handleError = (event) => {
    if (displaySrc && displaySrc !== src) {
      setDisplaySrc(src || '');
      return;
    }

    onError?.(event);
  };

  return (
    <img
      {...imageProps}
      className={className || undefined}
      src={displaySrc}
      alt={alt}
      onError={handleError}
    />
  );
}
