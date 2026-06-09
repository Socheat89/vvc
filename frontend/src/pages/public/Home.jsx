import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import { productService, bannerService, categoryService } from '../../services/api';
import BackgroundRemovedImage from '../../components/BackgroundRemovedImage';
import { getProductDisplayName } from '../../utils/productDisplay';
import 'swiper/css';
import 'swiper/css/pagination';

const PUBLIC_ASSET_BASE = 'https://vvc.asia/backend/public';
const PRODUCT_UPLOAD_BASE = `${PUBLIC_ASSET_BASE}/uploads/products`;
const CATEGORY_UPLOAD_BASE = `${PUBLIC_ASSET_BASE}/uploads/categories`;
const VIDEO_MEDIA_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v']);
const BANNER_CACHE_KEY = 'vvc_home_banners_cache';

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

const getUploadImageUrl = (image, fallbackBase = PRODUCT_UPLOAD_BASE) => {
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

  return `${fallbackBase}/${imagePath}`;
};

const getImageUrl = (image) => getUploadImageUrl(image, PRODUCT_UPLOAD_BASE);
const getBannerMediaUrl = (media) => getUploadImageUrl(media, `${PUBLIC_ASSET_BASE}/uploads/banners`);
const getCategoryImageUrl = (image) => getUploadImageUrl(image, CATEGORY_UPLOAD_BASE);

const getMediaTypeFromUrl = (media) => {
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

const isVideoMediaUrl = (media) => getMediaTypeFromUrl(media) === 'video';

const readCachedBanners = () => {
  if (typeof window === 'undefined') return [];

  try {
    const cachedBanners = JSON.parse(window.localStorage.getItem(BANNER_CACHE_KEY) || '[]');
    return Array.isArray(cachedBanners) ? cachedBanners : [];
  } catch {
    return [];
  }
};

const cacheBanners = (banners) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(BANNER_CACHE_KEY, JSON.stringify(banners.slice(0, 10)));
  } catch {
    // Cache is optional; the live API response is still enough.
  }
};

const preloadImage = (imageUrl) => {
  if (!imageUrl || typeof document === 'undefined') return;

  const alreadyPreloaded = Array.from(document.head.querySelectorAll('link[data-vvc-banner-preload]'))
    .some((link) => link.href === imageUrl);

  if (alreadyPreloaded) return;

  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'image';
  preloadLink.href = imageUrl;
  preloadLink.setAttribute('data-vvc-banner-preload', 'true');
  document.head.appendChild(preloadLink);
};

const preloadFirstBanner = (banners) => {
  const firstBanner = banners.find((banner) => banner?.image);
  if (firstBanner) {
    const bannerMediaUrl = getBannerMediaUrl(firstBanner.image);
    if (!isVideoMediaUrl(bannerMediaUrl)) {
      preloadImage(bannerMediaUrl);
    }
  }
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] || 'V') + (words[1]?.[0] || 'V');
};

const FEATURED_PRODUCTS_VISIBLE_COUNT = 4;
const FEATURED_PRODUCTS_ROTATION_MS = 5000;
const IMPORTED_CATEGORY_DESCRIPTION = 'Imported from product Excel file';
const featuredLoadingCards = Array.from({ length: FEATURED_PRODUCTS_VISIBLE_COUNT }, (_,  index) => index);
const productShowLoadingCards = Array.from({ length: 4 }, (_, index) => index);

const productShowText = {
  kicker: {
    kh: 'ស្វែងរកផលិតផលរបស់អ្នក!',
    en: 'Discover Your Desired Products!',
  },
  title: {
    kh: 'ផែនទីប្រភេទផលិតផលរបស់យើង',
    en: 'Explore Our Product Category Showcase',
  },
  desc: {
    kh: 'ងាយស្រួលនិងរីករាយក្នុងការស្វែងរកផលិតផលដែលអ្នកចង់បានតាមរយៈប្រភេទផលិតផលដ៏ស្អាតនិងសាមញ្ញរបស់យើង។',
    en: 'Easily and enjoyably discover the products you want through our beautiful and simple product category showcase.',
  },
  category: {
    kh: 'ប្រភេទផលិតផល',
    en: 'Category',
  },
  productCount: {
    kh: 'ផលិតផល',
    en: 'products',
  },
  empty: {
    kh: 'មិនទាន់មានប្រភេទផលិតផលសម្រាប់បង្ហាញ។',
    en: 'No categories to show yet.',
  },
  error: {
    kh: 'មិនអាចផ្ទុក Product Show បាននៅពេលនេះ។',
    en: 'Unable to load Product Show right now.',
  },
  fallbackDesc: {
    kh: 'ចូលមើលផលិតផលក្នុងប្រភេទនេះ',
    en: 'View products in this category',
  },
};

const shuffleProducts = (products) => {
  const shuffledProducts = [...products];

  for (let index = shuffledProducts.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledProducts[index], shuffledProducts[randomIndex]] = [
      shuffledProducts[randomIndex],
      shuffledProducts[index],
    ];
  }

  return shuffledProducts;
};

const normalizeLookupValue = (value) => String(value ?? '').trim();

const getCategoryDescription = (category, fallbackText) => {
  const description = normalizeLookupValue(category.description);

  return description === IMPORTED_CATEGORY_DESCRIPTION ? fallbackText : description || fallbackText;
};

const parseCountValue = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const count = Number(value);
  return Number.isFinite(count) ? count : null;
};

const buildProductCountLookup = (products) => {
  const counts = new Map();

  products.forEach((product) => {
    const categoryId = normalizeLookupValue(product.category_id ?? product.category?.id);
    const categoryName = normalizeLookupValue(product.category?.name || product.item_group).toLowerCase();
    const keys = [
      categoryId ? `id:${categoryId}` : '',
      categoryName ? `name:${categoryName}` : '',
    ].filter(Boolean);

    keys.forEach((key) => {
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  return counts;
};

const getCategoryProductCount = (category, productCountLookup) => {
  const apiCount = [
    category.products_count,
    category.product_count,
    category.productsCount,
    category.products_total,
    category.total_products,
  ].map(parseCountValue).find((count) => count !== null);

  if (apiCount !== undefined) return apiCount;

  if (Array.isArray(category.products)) {
    return category.products.length;
  }

  const categoryId = normalizeLookupValue(category.id);
  const categoryName = normalizeLookupValue(category.name).toLowerCase();

  return productCountLookup.get(`id:${categoryId}`)
    ?? productCountLookup.get(`name:${categoryName}`)
    ?? 0;
};

export default function Home() {
  const { language } = useLanguage();
  const t = translations.home;
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredStartIndex, setFeaturedStartIndex] = useState(0);
  const [productShowCategories, setProductShowCategories] = useState([]);
  const [productShowLoading, setProductShowLoading] = useState(true);
  const [productShowError, setProductShowError] = useState(false);
  const [banners, setBanners] = useState(() => readCachedBanners());
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const posterSlides = useMemo(() => {
    // If banners are loaded, use them; otherwise use default structure
    if (banners.length > 0) {
      return banners.map((banner) => {
        const bannerMediaUrl = getBannerMediaUrl(banner.image);

        return {
          id: banner.id.toString(),
          tone: banner.tone || 'gold',
          image: bannerMediaUrl,
          mediaType: getMediaTypeFromUrl(bannerMediaUrl),
          title: banner.title || '',
        };
      });
    }

    // Default slides when no banners are loaded
    return [
      {
        id: 'intro',
        tone: 'gold',
        image: '',
        mediaType: 'image',
      },
      {
        id: 'meaning',
        tone: 'paper',
        image: '',
        mediaType: 'image',
      },
      {
        id: 'featured',
        tone: 'ink',
        image: '',
        mediaType: 'image',
      },
    ];
  }, [banners]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch banners
        const bannersResponse = await bannerService.getForPlacement('home');
        const nextBanners = bannersResponse.data.data || [];
        if (isMounted) {
          preloadFirstBanner(nextBanners);
          setBanners(nextBanners);
          cacheBanners(nextBanners);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
        if (isMounted) {
          // Keep cached banners on screen if the live request fails.
          setBanners((currentBanners) => currentBanners);
        }
      }
    };

    const fetchFeaturedProducts = async () => {
      try {
        const response = await productService.getAll();
        const products = response.data.data || [];
        const shuffledProducts = shuffleProducts(
          [...products].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        );

        if (isMounted) {
          setFeaturedProducts(shuffledProducts);
          setFeaturedStartIndex(0);
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

    const fetchProductShowCategories = async () => {
      try {
        const response = await categoryService.getAll();
        if (isMounted) {
          setProductShowCategories(response.data.data || []);
          setProductShowError(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setProductShowError(true);
        }
      } finally {
        if (isMounted) {
          setProductShowLoading(false);
        }
      }
    };

    fetchData();
    fetchFeaturedProducts();
    fetchProductShowCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const firstImageSlide = posterSlides.find((slide) => slide.image && slide.mediaType !== 'video');
    preloadImage(firstImageSlide?.image);
  }, [posterSlides]);

  useEffect(() => {
    if (featuredProducts.length <= FEATURED_PRODUCTS_VISIBLE_COUNT) return undefined;

    const timer = window.setInterval(() => {
      setFeaturedStartIndex((currentIndex) => (
        (currentIndex + FEATURED_PRODUCTS_VISIBLE_COUNT) % featuredProducts.length
      ));
    }, FEATURED_PRODUCTS_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [featuredProducts.length]);

  const visibleFeaturedProducts = useMemo(() => {
    if (featuredProducts.length <= FEATURED_PRODUCTS_VISIBLE_COUNT) {
      return featuredProducts;
    }

    return Array.from({ length: FEATURED_PRODUCTS_VISIBLE_COUNT }, (_, index) => (
      featuredProducts[(featuredStartIndex + index) % featuredProducts.length]
    ));
  }, [featuredProducts, featuredStartIndex]);

  const productCountLookup = useMemo(() => (
    buildProductCountLookup(featuredProducts)
  ), [featuredProducts]);

  const productShowCards = useMemo(() => (
    productShowCategories.map((category) => {
      return {
        category,
        imageUrl: getCategoryImageUrl(category.showcase_image),
        productCount: getCategoryProductCount(category, productCountLookup),
      };
    })
  ), [productCountLookup, productShowCategories]);

  return (
    <div className="home-intro mesh-bg">
      <section className="home-hero-section">
        {posterSlides.length > 0 && (
          <Swiper
            className="home-poster-swiper"
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            autoHeight
            loop={posterSlides.length > 1}
            speed={850}
            grabCursor
            watchOverflow
            pagination={posterSlides.length > 1 ? { clickable: true } : false}
            autoplay={posterSlides.length > 1 ? {
              delay: 3600,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            } : false}
          >
            {posterSlides.map((slide, index) => {
              const hasSlideImage = slide.image && !imageErrors[`banner-${slide.id}`];
              const isVideoSlide = slide.mediaType === 'video' || isVideoMediaUrl(slide.image);
              const isFirstSlide = index === 0;

              return (
                <SwiperSlide key={slide.id}>
                  <article className={`home-poster-slide home-poster-slide-${slide.tone} ${hasSlideImage ? 'home-poster-slide-has-image' : ''}`}>
                    <div className="home-poster-content">
                      <div className="home-poster-art" aria-hidden="true">
                        <div className={`home-poster-banner ${hasSlideImage ? '' : 'home-poster-banner-empty'}`}>
                          {hasSlideImage && isVideoSlide && (
                            <video
                              src={slide.image}
                              aria-label={slide.title || 'Banner video'}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload={isFirstSlide ? 'auto' : 'metadata'}
                              onLoadedMetadata={(event) => {
                                event.currentTarget.closest('.swiper')?.swiper?.updateAutoHeight?.(0);
                              }}
                              onError={() => setImageErrors((current) => ({
                                ...current,
                                [`banner-${slide.id}`]: true,
                              }))}
                            />
                          )}
                          {hasSlideImage && !isVideoSlide && (
                            <img
                              src={slide.image}
                              alt=""
                              loading={isFirstSlide ? 'eager' : 'lazy'}
                              fetchPriority={isFirstSlide ? 'high' : 'auto'}
                              decoding="async"
                              sizes="100vw"
                              onLoad={(event) => {
                                event.currentTarget.closest('.swiper')?.swiper?.updateAutoHeight?.(0);
                              }}
                              onError={() => setImageErrors((current) => ({
                                ...current,
                                [`banner-${slide.id}`]: true,
                              }))}
                            />
                          )}
                        </div>
                      </div>
                    </div>
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
                  </article>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </section>

      <section id="product-show" className="home-product-show-section mx-auto max-w-6xl px-4 pb-10 pt-14">
        <div className="home-product-show-header reveal">
          <span>{productShowText.kicker[language]}</span>
          <h2>{productShowText.title[language]}</h2>
          <p>{productShowText.desc[language]}</p>
        </div>

        {productShowLoading ? (
          <div className="home-product-show-grid home-product-show-loading-grid" aria-label={t.featuredLoading[language]}>
            {productShowLoadingCards.map((item) => (
              <div key={item} className="home-product-show-card home-product-show-card-loading" aria-hidden="true">
                <div className="home-product-show-media">
                  <span className="loading-image" />
                </div>
                <div className="home-product-show-body">
                  <span className="loading-line loading-line-xs" />
                  <h3 className="loading-line loading-line-md" />
                  <p className="loading-text" />
                </div>
              </div>
            ))}
          </div>
        ) : productShowError ? (
          <div className="home-product-show-status">{productShowText.error[language]}</div>
        ) : productShowCards.length === 0 ? (
          <div className="home-product-show-status">{productShowText.empty[language]}</div>
        ) : (
          <div className="home-product-show-grid reveal reveal-delay-1">
            {productShowCards.map(({ category, imageUrl, productCount }) => {
              const hasImage = imageUrl && !imageErrors[`product-show-${category.id}`];

              return (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="home-product-show-card"
                >
                  <div className="home-product-show-media">
                    {hasImage ? (
                      <BackgroundRemovedImage
                        src={imageUrl}
                        alt={category.name}
                        onError={() => setImageErrors((current) => ({
                          ...current,
                          [`product-show-${category.id}`]: true,
                        }))}
                      />
                    ) : (
                      <div className="home-product-show-fallback">{getInitials(category.name)}</div>
                    )}
                  </div>
                  <div className="home-product-show-body">
                    <span>{productShowText.category[language]}</span>
                    <h3>{category.name}</h3>
                    <p>{getCategoryDescription(category, productShowText.fallbackDesc[language])}</p>
                    <div className="home-product-show-footer">
                      <strong>{productCount}</strong>
                      <small>{productShowText.productCount[language]}</small>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
                const productName = getProductDisplayName(product, language);
                const imageUrl = getImageUrl(product.image);
                const hasImage = imageUrl && !imageErrors[product.id];
                const stockCount = Math.max(0, Number(product.stock || 0));
                const inStock = stockCount > 0;
                const stockLabel = inStock
                  ? `${stockCount} ${t.featuredInStock[language]}`
                  : t.featuredOutOfStock[language];
                const price = Number(product.price || 0);
                const priceLabel = price > 0
                  ? `$${price.toFixed(2)}`
                  : t.featuredViewMore[language];

                return (
                  <Link key={product.id} to={`/products/${product.id}`} className="home-featured-card">
                    <div className="home-featured-media">
                      {hasImage ? (
                        <BackgroundRemovedImage
                          src={imageUrl}
                          alt={productName}
                          onError={() => setImageErrors((current) => ({ ...current, [product.id]: true }))}
                        />
                      ) : (
                        <div className="home-featured-fallback">{getInitials(productName)}</div>
                      )}
                      <span className={`home-featured-stock ${inStock ? 'in' : 'out'}`}>
                        {stockLabel}
                      </span>
                    </div>
                    <div className="home-featured-body">
                      <span>{product.category?.name || t.featuredCategory[language]}</span>
                      <h3>{productName}</h3>
                      <div className={`home-featured-stock-pill ${inStock ? 'in' : 'out'}`}>
                        {stockLabel}
                      </div>
                      <p>{product.description || t.featuredNoDescription[language]}</p>
                      <div className="home-featured-footer">
                        <strong className={price > 0 ? '' : 'home-featured-view-more'}>{priceLabel}</strong>
                        <small>{stockLabel}</small>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
