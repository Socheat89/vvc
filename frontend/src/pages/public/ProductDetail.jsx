import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

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

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedImageErrors, setRelatedImageErrors] = useState({});
  const { language } = useLanguage();
  const t = translations.productDetail;

  useEffect(() => {
    fetchProduct();
  }, [id]);

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
        })
        .slice(0, 4);

      setProduct(productData);
      setRelatedProducts(recommendations);
      setError(null);
      setImageError(false);
      setRelatedImageErrors({});
    } catch (err) {
      setError(t.loadError[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-16">{t.loading[language]}</div>;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-16 text-yellow-700">{error}</div>;
  if (!product) return <div className="mx-auto max-w-6xl px-4 py-16">{t.notFound[language]}</div>;

  const imageUrl = getImageUrl(product.image);
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
        <Link to="/products" className="product-detail-back">
          {t.backToProducts[language]}
        </Link>

        <section className="product-detail-shell">
          <div className="product-detail-media-card">
            <div className="product-detail-media">
              {hasImage ? (
                <img src={imageUrl} alt={product.name} onError={() => setImageError(true)} />
              ) : (
                <div className="product-detail-fallback">
                  <span>{getInitials(product.name)}</span>
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
            <h1>{product.name}</h1>

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
              <button disabled={!inStock} className="product-detail-primary-action">
                {inStock ? t.reserve[language] : t.outOfStock[language]}
              </button>
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
                const relatedImageUrl = getImageUrl(item.image);
                const hasRelatedImage = relatedImageUrl && !relatedImageErrors[item.id];

                return (
                  <Link key={item.id} to={`/products/${item.id}`} className="product-recommendation-card">
                    <div className="product-recommendation-media">
                      {hasRelatedImage ? (
                        <img
                          src={relatedImageUrl}
                          alt={item.name}
                          onError={() => setRelatedImageErrors((current) => ({ ...current, [item.id]: true }))}
                        />
                      ) : (
                        <div className="product-recommendation-fallback">{getInitials(item.name)}</div>
                      )}
                    </div>
                    <div className="product-recommendation-body">
                      <span>{item.category?.name || t.uncategorized[language]}</span>
                      <h3>{item.name}</h3>
                      <div>
                        <strong>${Number(item.price || 0).toFixed(2)}</strong>
                        <small>{t.viewProduct[language]}</small>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
