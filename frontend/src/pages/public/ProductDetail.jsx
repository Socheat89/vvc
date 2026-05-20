import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import BackgroundRemovedImage from '../../components/BackgroundRemovedImage';
import { getProductDisplayName } from '../../utils/productDisplay';

const PUBLIC_ASSET_BASE = 'https://app.vvc.asia/vvc_web/vvc/backend/public';
const PRODUCT_UPLOAD_BASE = `${PUBLIC_ASSET_BASE}/uploads/products`;

const extractUploadPath = (value) => {
  const normalizedValue = String(value).trim().replace(/\\/g, '/');
  const lowerValue = normalizedValue.toLowerCase();
  const productUploadIndex = lowerValue.indexOf('uploads/products/');
  const uploadIndex = lowerValue.indexOf('uploads/');

  if (productUploadIndex >= 0) {
    return normalizedValue.slice(productUploadIndex).replace(/^\/+/, '');
  }

  if (uploadIndex >= 0) {
    return normalizedValue.slice(uploadIndex).replace(/^\/+/, '');
  }

  return '';
};

const getImageUrl = (image) => {
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

  let imagePath = rawImage.replace(/^\/+/, '');
  imagePath = imagePath.replace(/^public\//i, '').replace(/^backend\/public\//i, '');

  return `${PRODUCT_UPLOAD_BASE}/${imagePath}`;
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] || 'V') + (words[1]?.[0] || 'V');
};

const loadingFacts = Array.from({ length: 4 }, (_, index) => index);

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedImageErrors, setRelatedImageErrors] = useState({});
  const { language } = useLanguage();
  const t = translations.productDetail;
  const nav = translations.header;
  const productListText = translations.productList;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!isImageViewerOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsImageViewerOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImageViewerOpen]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const [productResult, productListResult] = await Promise.allSettled([
        productService.getById(id),
        productService.getAll(),
      ]);

      if (productResult.status !== 'fulfilled') {
        throw productResult.reason;
      }

      const productData = productResult.value.data.data;
      const allProducts = productListResult.status === 'fulfilled'
        ? productListResult.value.data.data || []
        : [];
      const currentCategoryId = productData.category?.id || productData.category_id;
      const currentCategoryName = productData.category?.name;
      const recommendations = allProducts
        .filter((item) => {
          if (String(item.id) === String(productData.id)) return false;
          const itemCategoryId = item.category?.id || item.category_id;
          if (currentCategoryId && itemCategoryId) {
            return String(itemCategoryId) === String(currentCategoryId);
          }
          return currentCategoryName && item.category?.name === currentCategoryName;
        });

      setProduct(productData);
      setRelatedProducts(recommendations);
      setError(null);
      setImageError(false);
      setIsImageViewerOpen(false);
      setRelatedImageErrors({});
    } catch (err) {
      setError(t.loadError[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="product-breadcrumb product-detail-breadcrumb" aria-hidden="true">
            <span className="loading-line loading-line-sm" />
            <span className="loading-dot" />
            <span className="loading-line loading-line-xs" />
            <span className="loading-dot" />
            <span className="loading-line loading-line-md" />
          </div>

          <span className="product-detail-back product-detail-back-loading" aria-hidden="true" />

          <section className="product-detail-shell" aria-label={t.loading[language]}>
            <div className="product-detail-media-card product-detail-media-card-loading" aria-hidden="true">
              <div className="product-detail-media">
                <span className="loading-image loading-image-large" />
              </div>
              <div className="product-detail-media-caption">
                <span className="loading-line loading-line-xs" />
                <strong className="loading-line loading-line-xs" />
              </div>
            </div>

            <div className="product-detail-content product-detail-content-loading" aria-hidden="true">
              <span className="loading-pill" />
              <span className="loading-title loading-title-wide" />
              <div className="product-detail-price-row">
                <span className="loading-price loading-price-lg" />
                <strong className="loading-chip" />
              </div>
              <div className="product-detail-summary">
                <span className="loading-line loading-line-md" />
                <span className="loading-text" />
                <span className="loading-text loading-text-short" />
              </div>
              <div className="product-detail-grid">
                {loadingFacts.map((item) => (
                  <div key={item} className="product-detail-fact">
                    <span className="loading-line loading-line-xs" />
                    <strong className="loading-line loading-line-sm" />
                  </div>
                ))}
              </div>
              <div className="product-detail-action-row">
                <span className="loading-button" />
                <span className="loading-button loading-button-light" />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
  if (error) return <div className="mx-auto max-w-6xl px-4 py-16 text-yellow-700">{error}</div>;
  if (!product) return <div className="mx-auto max-w-6xl px-4 py-16">{t.notFound[language]}</div>;

  const imageUrl = getImageUrl(product.image);
  const productName = getProductDisplayName(product, language);
  const hasImage = imageUrl && !imageError;
  const inStock = Number(product.stock) > 0;
  const details = [
    { label: t.category[language], value: product.category?.name || t.uncategorized[language] },
    { label: t.stock[language], value: inStock ? `${product.stock} ${t.inStock[language]}` : t.outOfStock[language] },
    { label: t.itemCode[language], value: product.item_code || product.code || `#${product.id}` },
    { label: t.price[language], value: `$${Number(product.price || 0).toFixed(2)}` },
  ];

  return (
    <div className="product-detail-page">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <nav className="product-breadcrumb product-detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{nav.home[language]}</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products">{nav.products[language]}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{productName}</span>
        </nav>

        <Link to="/products" className="product-detail-back">
          {t.backToProducts[language]}
        </Link>

        <section className="product-detail-shell">
          <div className="product-detail-media-card">
            <div className="product-detail-media">
              {hasImage ? (
                <button
                  type="button"
                  className="product-detail-image-button"
                  onClick={() => setIsImageViewerOpen(true)}
                  aria-label={`View ${productName} image larger`}
                >
                  <BackgroundRemovedImage
                    src={imageUrl}
                    alt={productName}
                    onError={() => {
                      setImageError(true);
                      setIsImageViewerOpen(false);
                    }}
                  />
                  <span className="product-detail-image-zoom" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M10.8 5.2a5.6 5.6 0 1 0 0 11.2 5.6 5.6 0 0 0 0-11.2Zm0 2a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Z" />
                      <path d="m15 15 4.1 4.1a1.2 1.2 0 0 1-1.7 1.7L13.3 16.7 15 15Z" />
                    </svg>
                  </span>
                </button>
              ) : (
                <div className="product-detail-fallback">
                  <span>{getInitials(productName)}</span>
                  <small>{t.imagePreview[language]}</small>
                </div>
              )}
            </div>
            <div className="product-detail-media-caption">
              <span>{product.category?.name || t.uncategorized[language]}</span>
              <strong>{inStock ? t.available[language] : t.outOfStock[language]}</strong>
            </div>
          </div>

          <div className="product-detail-content">
            <div className="product-detail-kicker">{t.productPassport[language]}</div>
            <h1>{productName}</h1>

            <div className="product-detail-price-row">
              <span>${Number(product.price || 0).toFixed(2)}</span>
              <strong className={inStock ? 'in' : 'out'}>
                {inStock ? `${product.stock} ${t.inStock[language]}` : t.outOfStock[language]}
              </strong>
            </div>

            <div className="product-detail-summary">
              <h2>{t.productDetails[language]}</h2>
              <p>{product.description || t.noDescription[language]}</p>
            </div>

            <div className="product-detail-grid">
              {details.map((item) => (
                <div key={item.label} className="product-detail-fact">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="product-detail-action-row">
              <Link to="/products" className="product-detail-secondary-action">
                {t.viewMore[language]}
              </Link>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="product-recommendation-section">
            <div className="product-recommendation-header">
              <div>
                <span>{t.sameCategory[language]}</span>
                <h2>{t.recommendedTitle[language]}</h2>
                <p>{t.recommendedDesc[language]}</p>
              </div>
              <Link to="/products" className="product-detail-secondary-action">
                {t.viewMore[language]}
              </Link>
            </div>

            <div className="product-recommendation-grid">
              {relatedProducts.map((item) => {
                const itemName = getProductDisplayName(item, language);
                const relatedImageUrl = getImageUrl(item.image);
                const hasRelatedImage = relatedImageUrl && !relatedImageErrors[item.id];
                const itemPrice = Number(item.price || 0);
                const itemPriceLabel = itemPrice > 0 ? `$${itemPrice.toFixed(2)}` : t.priceViewMore[language];

                return (
                  <Link key={item.id} to={`/products/${item.id}`} className="product-recommendation-card">
                    <div className="product-recommendation-media">
                      {hasRelatedImage ? (
                        <BackgroundRemovedImage
                          src={relatedImageUrl}
                          alt={itemName}
                          onError={() => setRelatedImageErrors((current) => ({ ...current, [item.id]: true }))}
                        />
                      ) : (
                        <div className="product-recommendation-fallback">{getInitials(itemName)}</div>
                      )}
                    </div>
                    <div className="product-recommendation-body">
                      <span>{item.category?.name || t.uncategorized[language]}</span>
                      <h3>{itemName}</h3>
                      <div>
                        <strong className={itemPrice > 0 ? '' : 'product-recommendation-view-more'}>
                          {itemPriceLabel}
                        </strong>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {isImageViewerOpen && hasImage && (
        <div className="product-image-lightbox" role="dialog" aria-modal="true" aria-label={t.imagePreview[language]}>
          <button
            type="button"
            className="product-image-lightbox-backdrop"
            onClick={() => setIsImageViewerOpen(false)}
            aria-label="Close"
          />
          <div className="product-image-lightbox-panel">
            <button
              type="button"
              className="product-image-lightbox-close"
              onClick={() => setIsImageViewerOpen(false)}
              aria-label="Close"
              autoFocus
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <div className="product-image-lightbox-frame">
              <BackgroundRemovedImage src={imageUrl} alt={productName} />
            </div>
            <div className="product-image-lightbox-caption">
              <span>{product.category?.name || t.uncategorized[language]}</span>
              <strong>{productName}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="product-mobile-tools product-recommendation-mobile-tools" aria-label="Product recommendation quick tools">
        <Link
          to="/products?panel=search"
          className="product-mobile-tool"
          aria-label={productListText.searchLabel[language]}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.8 5.2a5.6 5.6 0 1 0 0 11.2 5.6 5.6 0 0 0 0-11.2Zm0 2a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Z" />
            <path d="m15 15 4.1 4.1a1.2 1.2 0 0 1-1.7 1.7L13.3 16.7 15 15Z" />
          </svg>
        </Link>
        <Link
          to="/products?panel=category"
          className="product-mobile-tool"
          aria-label={productListText.categories[language]}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5.8C5 4.8 5.8 4 6.8 4h3.4C11.2 4 12 4.8 12 5.8v3.4c0 1-.8 1.8-1.8 1.8H6.8C5.8 11 5 10.2 5 9.2V5.8Zm7 9c0-1 .8-1.8 1.8-1.8h3.4c1 0 1.8.8 1.8 1.8v3.4c0 1-.8 1.8-1.8 1.8h-3.4c-1 0-1.8-.8-1.8-1.8v-3.4ZM5 14.8c0-1 .8-1.8 1.8-1.8h3.4c1 0 1.8.8 1.8 1.8v3.4c0 1-.8 1.8-1.8 1.8H6.8C5.8 20 5 19.2 5 18.2v-3.4ZM13.8 4h3.4c1 0 1.8.8 1.8 1.8v3.4c0 1-.8 1.8-1.8 1.8h-3.4c-1 0-1.8-.8-1.8-1.8V5.8c0-1 .8-1.8 1.8-1.8Z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
