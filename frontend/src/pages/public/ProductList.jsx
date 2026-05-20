import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { categoryService, productService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import BackgroundRemovedImage from '../../components/BackgroundRemovedImage';
import { getProductDisplayName, getProductSearchText } from '../../utils/productDisplay';

const DESKTOP_PER_PAGE = 6;
const MOBILE_PER_PAGE = 12;
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

const loadingCards = Array.from({ length: 6 }, (_, index) => index);
const loadingCategories = Array.from({ length: 5 }, (_, index) => index);

export default function ProductList() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileCatalog, setIsMobileCatalog] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const { language } = useLanguage();
  const t = translations.productList;
  const nav = translations.header;
  const perPage = isMobileCatalog ? MOBILE_PER_PAGE : DESKTOP_PER_PAGE;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateMobileCatalog = () => setIsMobileCatalog(mediaQuery.matches);

    updateMobileCatalog();
    mediaQuery.addEventListener('change', updateMobileCatalog);

    return () => mediaQuery.removeEventListener('change', updateMobileCatalog);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, stockFilter, sortBy, searchTerm]);

  useEffect(() => {
    if (!isMobileCatalog) {
      setActiveMobilePanel(null);
    }
  }, [isMobileCatalog]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stock = params.get('stock');
    const category = params.get('category');

    if (stock === 'all' || stock === 'in' || stock === 'out') {
      setStockFilter(stock);
    }

    if (category) {
      setSelectedCategory(category);
    }

    if (isMobileCatalog) {
      const panel = params.get('panel');
      if (panel === 'search' || panel === 'category') {
        setActiveMobilePanel(panel);
      }
    }
  }, [isMobileCatalog, location.search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productResult, categoryResult] = await Promise.allSettled([
        productService.getAll(),
        categoryService.getAll(),
      ]);

      if (productResult.status !== 'fulfilled') {
        throw productResult.reason;
      }

      const productData = productResult.value.data.data || [];
      const categoryData = categoryResult.status === 'fulfilled'
        ? categoryResult.value.data.data || []
        : [];

      setProducts(productData);
      setCategories(categoryData);
      setError(null);
    } catch (err) {
      setError(t.loadError[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();

    categories.forEach((category) => {
      categoryMap.set(String(category.id), {
        id: String(category.id),
        name: category.name,
        count: 0,
      });
    });

    products.forEach((product) => {
      const id = product.category?.id || product.category_id;
      if (!id) return;
      const key = String(id);
      const existing = categoryMap.get(key) || {
        id: key,
        name: product.category?.name || t.category[language],
        count: 0,
      };
      existing.count += 1;
      categoryMap.set(key, existing);
    });

    return Array.from(categoryMap.values());
  }, [categories, products, language, t]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return products
      .filter((product) => {
        const categoryId = String(product.category?.id || product.category_id || '');
        const categoryName = product.category?.name || '';
        const matchesCategory = selectedCategory === 'all' || categoryId === selectedCategory;
        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'in' && Number(product.stock) > 0) ||
          (stockFilter === 'out' && Number(product.stock) <= 0);
        const searchText = getProductSearchText(product, categoryName);
        const matchesSearch = !term || searchText.includes(term);

        return matchesCategory && matchesStock && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return getProductDisplayName(a, language).localeCompare(getProductDisplayName(b, language));
        }
        if (sortBy === 'price-low') {
          return Number(a.price || 0) - Number(b.price || 0);
        }
        if (sortBy === 'price-high') {
          return Number(b.price || 0) - Number(a.price || 0);
        }
        return Number(b.id || 0) - Number(a.id || 0);
      });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy, language]);

  const searchSuggestions = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return [];

    return products
      .filter((product) => {
        const categoryId = String(product.category?.id || product.category_id || '');
        const categoryName = product.category?.name || '';
        const matchesCategory = selectedCategory === 'all' || categoryId === selectedCategory;
        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'in' && Number(product.stock) > 0) ||
          (stockFilter === 'out' && Number(product.stock) <= 0);
        const searchText = getProductSearchText(product, categoryName);

        return matchesCategory && matchesStock && searchText.includes(term);
      })
      .slice(0, 5);
  }, [products, searchInput, selectedCategory, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * perPage, currentPage * perPage);
  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    Boolean(searchTerm) ||
    selectedCategory !== 'all' ||
    stockFilter !== 'all' ||
    sortBy !== 'newest';

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('all');
    setStockFilter('all');
    setSortBy('newest');
  };

  const closeMobilePanel = () => setActiveMobilePanel(null);

  const renderCategoryPanel = (extraClassName = '', closeOnSelect = false) => (
    <aside className={`product-category-panel ${extraClassName}`.trim()}>
      <div className="product-panel-title">{t.categories[language]}</div>
      <button
        type="button"
        className={`product-category-button ${selectedCategory === 'all' ? 'active' : ''}`}
        onClick={() => {
          setSelectedCategory('all');
          if (closeOnSelect) closeMobilePanel();
        }}
      >
        <span>{t.allCategories[language]}</span>
        <strong>{products.length}</strong>
      </button>
      {categoryOptions.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`product-category-button ${selectedCategory === category.id ? 'active' : ''}`}
          onClick={() => {
            setSelectedCategory(category.id);
            if (closeOnSelect) closeMobilePanel();
          }}
        >
          <span>{category.name}</span>
          <strong>{category.count}</strong>
        </button>
      ))}
      <button
        type="button"
        className="product-reset-button"
        onClick={() => {
          resetFilters();
          if (closeOnSelect) closeMobilePanel();
        }}
      >
        {t.reset[language]}
      </button>
    </aside>
  );

  const renderSearchPanel = (inputId = 'product-search', extraClassName = '') => (
    <div className={`product-search-panel ${extraClassName}`.trim()}>
      <label htmlFor={inputId}>{t.searchLabel[language]}</label>
      <div className="product-search-row">
        <input
          id={inputId}
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSearch();
          }}
          placeholder={t.searchPlaceholder[language]}
        />
        <button type="button" className="product-search-button" onClick={handleSearch}>
          {t.search[language]}
        </button>
      </div>

      {searchInput.trim() && (
        <div className="product-search-results">
          <div className="product-search-results-title">
            <span>{t.quickResults[language]}</span>
            <strong>{searchSuggestions.length}</strong>
          </div>

          {searchSuggestions.length > 0 ? (
            <div className="product-search-results-list">
              {searchSuggestions.map((product) => {
                const productName = getProductDisplayName(product, language);
                const imageUrl = getImageUrl(product.image);
                const hasImage = imageUrl && !imageErrors[`suggestion-${product.id}`];

                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="product-search-result-item"
                  >
                    <div className="product-search-result-image">
                      {hasImage ? (
                        <img
                          src={imageUrl}
                          alt={productName}
                          onError={() => setImageErrors((current) => ({
                            ...current,
                            [`suggestion-${product.id}`]: true,
                          }))}
                        />
                      ) : (
                        <span>{getInitials(productName)}</span>
                      )}
                    </div>
                    <div>
                      <strong>{productName}</strong>
                      <p>{product.category?.name || t.category[language]}</p>
                    </div>
                    <small>${Number(product.price || 0).toFixed(2)}</small>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="product-search-no-results">{t.noMatches[language]}</div>
          )}
        </div>
      )}

      <div className="product-filter-row">
        <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
          <option value="all">{t.allStock[language]}</option>
          <option value="in">{t.inStockOnly[language]}</option>
          <option value="out">{t.outOfStockOnly[language]}</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="newest">{t.newestFirst[language]}</option>
          <option value="name">{t.nameAsc[language]}</option>
          <option value="price-low">{t.priceLow[language]}</option>
          <option value="price-high">{t.priceHigh[language]}</option>
        </select>
        <button type="button" className="product-filter-button" onClick={() => setCurrentPage(1)}>
          {t.filter[language]}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="product-page">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="product-breadcrumb product-loading-breadcrumb" aria-hidden="true">
            <span className="loading-line loading-line-sm" />
            <span className="loading-dot" />
            <span className="loading-line loading-line-xs" />
          </div>

          <section className="product-list-hero">
            <div className="product-loading-copy" aria-hidden="true">
              <span className="loading-pill" />
              <span className="loading-title" />
              <span className="loading-text" />
              <span className="loading-text loading-text-short" />
            </div>

            <div className="product-list-summary-card product-loading-summary" aria-hidden="true">
              <div>
                <span className="loading-line loading-line-xs" />
                <strong className="loading-number" />
              </div>
              <div>
                <span className="loading-line loading-line-xs" />
                <strong className="loading-number" />
              </div>
              <div>
                <span className="loading-line loading-line-xs" />
                <strong className="loading-number" />
              </div>
            </div>
          </section>

          <div className="product-catalog-layout">
            <aside className="product-category-panel product-loading-panel" aria-hidden="true">
              <span className="loading-line loading-line-sm" />
              {loadingCategories.map((item) => (
                <span key={item} className="loading-category-row" />
              ))}
            </aside>

            <section className="product-catalog-main" aria-label={t.loading[language]}>
              <div className="product-sticky-filters">
                <div className="product-search-panel product-loading-filter" aria-hidden="true">
                  <span className="loading-line loading-line-sm" />
                  <span className="loading-input" />
                  <div className="product-filter-row">
                    <span className="loading-input" />
                    <span className="loading-input" />
                    <span className="loading-button" />
                  </div>
                </div>
              </div>

              <div className="product-results-bar" aria-hidden="true">
                <span className="loading-line loading-line-sm" />
                <span className="loading-chip" />
              </div>

              <div className="product-grid" aria-hidden="true">
                {loadingCards.map((item) => (
                  <div key={item} className="product-card product-card-skeleton">
                    <div className="product-card-media">
                      <span className="loading-image" />
                    </div>
                    <div className="product-card-body">
                      <span className="loading-line loading-line-xs" />
                      <span className="loading-line loading-line-md" />
                      <div className="product-card-footer">
                        <span className="loading-price" />
                        <small className="loading-line loading-line-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="mx-auto max-w-6xl px-4 py-16 text-yellow-700">{error}</div>;

  return (
    <div className="product-page">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{nav.home[language]}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{nav.products[language]}</span>
        </nav>

        <section className="product-list-hero">
          <div>
            <span className="pill">{t.tagline[language]}</span>
            <h1 className="section-title mt-4">{t.title[language]}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{t.desc[language]}</p>
          </div>

          <div className="product-list-summary-card">
            <div>
              <span>{nav.products[language]}</span>
              <strong>{products.length}</strong>
            </div>
            <div>
              <span>{t.categories[language]}</span>
              <strong>{categoryOptions.length}</strong>
            </div>
            <div>
              <span>{t.perPage[language]}</span>
              <strong>{perPage}</strong>
            </div>
          </div>
        </section>

        <div className="product-catalog-layout">
          {renderCategoryPanel('product-category-panel-desktop')}

          <section className="product-catalog-main">
            <div className="product-sticky-filters">
              {renderSearchPanel()}
            </div>

            <div className="product-results-bar">
              <div>
                <strong>{filteredProducts.length}</strong> {t.results[language]}
              </div>
              <div className="product-per-page">
                {t.perPage[language]}: <strong>{perPage}</strong>
              </div>
            </div>

            {renderCategoryPanel('product-category-panel-mobile')}

            {filteredProducts.length === 0 ? (
              <div className="product-empty-state">
                <div className="product-empty-icon" aria-hidden="true">
                  <span>VVC</span>
                </div>
                <h2>{products.length === 0 ? t.noProducts[language] : t.noMatches[language]}</h2>
                <p>{t.emptyHelp[language]}</p>
                <div className="product-empty-actions">
                  {hasActiveFilters && (
                    <button type="button" className="product-search-button" onClick={resetFilters}>
                      {t.reset[language]}
                    </button>
                  )}
                  <Link to="/" className="product-filter-button">
                    {nav.home[language]}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {paginatedProducts.map((product) => {
                    const productName = getProductDisplayName(product, language);
                    const imageUrl = getImageUrl(product.image);
                    const hasImage = imageUrl && !imageErrors[product.id];
                    const price = Number(product.price || 0);
                    const priceLabel = price > 0 ? `$${price.toFixed(2)}` : t.viewMore[language];

                    return (
                      <Link key={product.id} to={`/products/${product.id}`} className="product-card">
                        <div className="product-card-media">
                          {hasImage ? (
                            <BackgroundRemovedImage
                              src={imageUrl}
                              alt={productName}
                              onError={() => setImageErrors((current) => ({ ...current, [product.id]: true }))}
                            />
                          ) : (
                            <div className="product-image-fallback">{getInitials(productName)}</div>
                          )}
                          <span className={`product-stock-badge ${Number(product.stock) > 0 ? 'in' : 'out'}`}>
                            {Number(product.stock) > 0 ? t.inStock[language] : t.outOfStock[language]}
                          </span>
                        </div>
                        <div className="product-card-body">
                          <div className="product-card-category">
                            {product.category?.name || t.category[language]}
                          </div>
                          <h3>{productName}</h3>
                          <div className="product-card-footer">
                            <span className={price > 0 ? '' : 'product-card-view-more'}>{priceLabel}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="product-pagination">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    {t.prev[language]}
                  </button>
                  <span>
                    {t.page[language]} {currentPage} {t.of[language]} {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    {t.next[language]}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <div className="product-mobile-tools" aria-label="Product quick tools">
        <button
          type="button"
          className={`product-mobile-tool ${activeMobilePanel === 'search' || hasActiveFilters ? 'active' : ''}`}
          onClick={() => setActiveMobilePanel((current) => (current === 'search' ? null : 'search'))}
          aria-label={t.searchLabel[language]}
          aria-expanded={activeMobilePanel === 'search'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.8 5.2a5.6 5.6 0 1 0 0 11.2 5.6 5.6 0 0 0 0-11.2Zm0 2a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Z" />
            <path d="m15 15 4.1 4.1a1.2 1.2 0 0 1-1.7 1.7L13.3 16.7 15 15Z" />
          </svg>
        </button>
        <button
          type="button"
          className={`product-mobile-tool ${activeMobilePanel === 'category' || selectedCategory !== 'all' ? 'active' : ''}`}
          onClick={() => setActiveMobilePanel((current) => (current === 'category' ? null : 'category'))}
          aria-label={t.categories[language]}
          aria-expanded={activeMobilePanel === 'category'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5.8C5 4.8 5.8 4 6.8 4h3.4C11.2 4 12 4.8 12 5.8v3.4c0 1-.8 1.8-1.8 1.8H6.8C5.8 11 5 10.2 5 9.2V5.8Zm7 9c0-1 .8-1.8 1.8-1.8h3.4c1 0 1.8.8 1.8 1.8v3.4c0 1-.8 1.8-1.8 1.8h-3.4c-1 0-1.8-.8-1.8-1.8v-3.4ZM5 14.8c0-1 .8-1.8 1.8-1.8h3.4c1 0 1.8.8 1.8 1.8v3.4c0 1-.8 1.8-1.8 1.8H6.8C5.8 20 5 19.2 5 18.2v-3.4ZM13.8 4h3.4c1 0 1.8.8 1.8 1.8v3.4c0 1-.8 1.8-1.8 1.8h-3.4c-1 0-1.8-.8-1.8-1.8V5.8c0-1 .8-1.8 1.8-1.8Z" />
          </svg>
        </button>
      </div>

      {activeMobilePanel && (
        <>
          <button
            type="button"
            className="product-mobile-sheet-backdrop"
            aria-label={t.cancel?.[language] || 'Close'}
            onClick={closeMobilePanel}
          />
          <section className="product-mobile-sheet" role="dialog" aria-modal="true">
            <div className="product-mobile-sheet-header">
              <h2>{activeMobilePanel === 'search' ? t.searchLabel[language] : t.categories[language]}</h2>
              <button type="button" onClick={closeMobilePanel} aria-label={t.cancel?.[language] || 'Close'}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z" />
                </svg>
              </button>
            </div>
            {activeMobilePanel === 'search'
              ? renderSearchPanel('product-mobile-search', 'product-search-panel-sheet')
              : renderCategoryPanel('product-category-panel-sheet', true)}
          </section>
        </>
      )}
    </div>
  );
}
