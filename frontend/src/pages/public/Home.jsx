import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import { productService, bannerService } from '../../services/api';
import 'swiper/css';
import 'swiper/css/pagination';

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

const featuredLoadingCards = Array.from({ length: 4 }, (_, index) => index);

export default function Home() {
  const { language } = useLanguage();
  const t = translations.home;
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const principles = [
    { step: '01', titleKey: 'feature1Title', descKey: 'feature1Desc' },
    { step: '02', titleKey: 'feature2Title', descKey: 'feature2Desc' },
    { step: '03', titleKey: 'feature3Title', descKey: 'feature3Desc' },
  ];

  const howSteps = [
    { step: '01', titleKey: 'howStep1Title', descKey: 'howStep1Desc' },
    { step: '02', titleKey: 'howStep2Title', descKey: 'howStep2Desc' },
    { step: '03', titleKey: 'howStep3Title', descKey: 'howStep3Desc' },
  ];

  const posterSlides = useMemo(() => {
    // If banners are loaded, use them; otherwise use default structure
    if (banners.length > 0) {
      return banners.map((banner) => ({
        id: banner.id.toString(),
        tone: banner.tone || 'gold',
        image: banner.image || '',
        title: banner.title || '',
      }));
    }

    // Default slides when no banners are loaded
    return [
      {
        id: 'intro',
        tone: 'gold',
        image: '',
      },
      {
        id: 'meaning',
        tone: 'paper',
        image: '',
      },
      {
        id: 'featured',
        tone: 'ink',
        image: '',
      },
    ];
  }, [banners]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch banners
        const bannersResponse = await bannerService.getAll();
        if (isMounted) {
          setBanners(bannersResponse.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
        if (isMounted) {
          // Use default banners if fetch fails
          setBanners([]);
        }
      } finally {
        if (isMounted) {
          setBannersLoading(false);
        }
      }
    };

    const fetchFeaturedProducts = async () => {
      try {
        const response = await productService.getAll();
        const products = response.data.data || [];
        const latestProducts = [...products]
          .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
          .slice(0, 6);

        if (isMounted) {
          setFeaturedProducts(latestProducts);
          setFeaturedError(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setFeaturedError(true);
        }
      } finally {
        if (isMounted) {
          setFeaturedLoading(false);
        }
      }
    };

    fetchData();
    fetchFeaturedProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleFeaturedProducts = useMemo(() => featuredProducts.slice(0, 4), [featuredProducts]);

  return (
    <div className="home-intro mesh-bg">
      <section className="home-hero-section">
        <Swiper
          className="home-poster-swiper"
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          loop
          speed={900}
          pagination={{ clickable: true }}
          autoplay={{
            delay: 3600,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
        >
          {posterSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <article className={`home-poster-slide home-poster-slide-${slide.tone}`}>
                <div className="home-wave-ui home-poster-wave" aria-hidden="true">
                  <svg className="home-wave home-wave-back" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path d="M0,224 C160,188 300,174 430,196 C585,222 694,300 858,270 C1010,242 1134,148 1288,144 C1352,142 1406,154 1440,166 L1440,320 L0,320 Z" />
                  </svg>
                  <svg className="home-wave home-wave-mid" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path d="M0,206 C170,246 288,252 430,216 C565,182 642,112 790,138 C942,164 1030,264 1192,250 C1296,240 1372,194 1440,176 L1440,320 L0,320 Z" />
                  </svg>
                  <svg className="home-wave home-wave-front" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path d="M0,250 C150,224 278,212 420,232 C575,254 692,302 842,284 C1000,266 1084,202 1238,196 C1318,194 1388,210 1440,226 L1440,320 L0,320 Z" />
                  </svg>
                </div>
                <div className="home-poster-content">
                  <div className="home-poster-art reveal" aria-hidden="true">
                    <div className={`home-poster-banner ${slide.image ? '' : 'home-poster-banner-empty'}`}>
                      {slide.image && <img src={slide.image} alt="" />}
                    </div>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section id="product-story" className="home-story-section mx-auto max-w-6xl px-4 pb-16 pt-14">
        <div className="home-guide-header reveal">
          <span className="home-guide-kicker">{t.guideTagline[language]}</span>
          <h2>{t.guideTitle[language]}</h2>
          <p>{t.guideDesc[language]}</p>
        </div>

        <div className="home-guide-map reveal reveal-delay-1">
          {principles.map((feature, index) => (
            <article
              key={feature.step}
              className={`home-guide-step ${index === 1 ? 'home-guide-step-lower' : ''}`}
            >
              <div className="home-guide-pin">
                <span>{feature.step}</span>
              </div>
              <div className="home-guide-card">
                <div className="home-guide-card-meta">{t.guideStep[language]} {feature.step}</div>
                <h3>{t[feature.titleKey][language]}</h3>
                <p>{t[feature.descKey][language]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="featured-products" className="home-featured-section">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="home-section-heading reveal">
            <div>
              <span>{t.featuredProductsKicker[language]}</span>
              <h2>{t.featuredProductsTitle[language]}</h2>
              <p>{t.featuredProductsDesc[language]}</p>
            </div>
            <Link to="/products" className="home-section-link">
              {t.viewAllProducts[language]}
            </Link>
          </div>

          {featuredLoading ? (
            <div className="home-featured-grid home-featured-loading-grid" aria-label={t.featuredLoading[language]}>
              {featuredLoadingCards.map((item) => (
                <div key={item} className="home-featured-card home-featured-card-loading" aria-hidden="true">
                  <div className="home-featured-media">
                    <span className="loading-image" />
                  </div>
                  <div className="home-featured-body">
                    <span className="loading-line loading-line-xs" />
                    <h3 className="loading-line loading-line-md" />
                    <p className="loading-text" />
                    <div className="home-featured-footer">
                      <strong className="loading-price" />
                      <small className="loading-line loading-line-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredError ? (
            <div className="home-featured-status">{t.featuredError[language]}</div>
          ) : visibleFeaturedProducts.length === 0 ? (
            <div className="home-featured-status">{t.featuredEmpty[language]}</div>
          ) : (
            <div className="home-featured-grid reveal reveal-delay-1">
              {visibleFeaturedProducts.map((product) => {
                const imageUrl = getImageUrl(product.image);
                const hasImage = imageUrl && !imageErrors[product.id];
                const inStock = Number(product.stock) > 0;

                return (
                  <Link key={product.id} to={`/products/${product.id}`} className="home-featured-card">
                    <div className="home-featured-media">
                      {hasImage ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          onError={() => setImageErrors((current) => ({ ...current, [product.id]: true }))}
                        />
                      ) : (
                        <div className="home-featured-fallback">{getInitials(product.name)}</div>
                      )}
                      <span className={`home-featured-stock ${inStock ? 'in' : 'out'}`}>
                        {inStock ? t.featuredInStock[language] : t.featuredOutOfStock[language]}
                      </span>
                    </div>
                    <div className="home-featured-body">
                      <span>{product.category?.name || t.featuredCategory[language]}</span>
                      <h3>{product.name}</h3>
                      <p>{product.description || t.featuredNoDescription[language]}</p>
                      <div className="home-featured-footer">
                        <strong>${Number(product.price || 0).toFixed(2)}</strong>
                        <small>{t.viewProduct[language]}</small>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="home-how-section">
        <div className="home-how-layout mx-auto max-w-6xl px-4 py-16">
          <div className="home-section-heading home-section-heading-left reveal">
            <div>
              <span>{t.howKicker[language]}</span>
              <h2>{t.howTitle[language]}</h2>
              <p>{t.howDesc[language]}</p>
            </div>
            <Link to="/products" className="home-section-link home-how-link">
              {t.howCta[language]}
            </Link>
          </div>

          <div className="home-how-steps reveal reveal-delay-1">
            {howSteps.map((step) => (
              <article key={step.step} className="home-how-step">
                <div className="home-how-index">{step.step}</div>
                <div>
                  <h3>{t[step.titleKey][language]}</h3>
                  <p>{t[step.descKey][language]}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
