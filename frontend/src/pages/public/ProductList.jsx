import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryService, productService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

const PER_PAGE = 6;

const getImageUrl = (image) => {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `https://app.vvc.asia/vvc_web/vvc/backend/public/${String(image).replace(/^\/+/, '')}`;
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] || 'V') + (words[1]?.[0] || 'V');
};

export default function ProductList() {
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
  const [imageErrors, setImageErrors] = useState({});
  const { language } = useLanguage();
  const t = translations.productList;

  useEffect(() => {
    fetchData();
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
        const searchText = `${product.name || ''} ${product.description || ''} ${categoryName}`.toLowerCase();
        const matchesSearch = !term || searchText.includes(term);

        return matchesCategory && matchesStock && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return String(a.name || '').localeCompare(String(b.name || ''));
        }
        if (sortBy === 'price-low') {
          return Number(a.price || 0) - Number(b.price || 0);
        }
        if (sortBy === 'price-high') {
          return Number(b.price || 0) - Number(a.price || 0);
        }
        return Number(b.id || 0) - Number(a.id || 0);
      });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy]);

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
        const searchText = `${product.name || ''} ${product.description || ''} ${categoryName}`.toLowerCase();

        return matchesCategory && matchesStock && searchText.includes(term);
      })
      .slice(0, 5);
  }, [products, searchInput, selectedCategory, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

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

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-16">{t.loading[language]}</div>;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-16 text-yellow-700">{error}</div>;

  return (
    <div className="product-page">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <section className="product-list-hero">
          <div>
            <span className="pill">{t.tagline[language]}</span>
            <h1 className="section-title mt-4">{t.title[language]}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{t.desc[language]}</p>
          </div>

          <div className="product-search-panel">
            <label htmlFor="product-search">{t.searchLabel[language]}</label>
            <div className="product-search-row">
              <input
                id="product-search"
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
                                alt={product.name}
                                onError={() => setImageErrors((current) => ({
                                  ...current,
                                  [`suggestion-${product.id}`]: true,
                                }))}
                              />
                            ) : (
                              <span>{getInitials(product.name)}</span>
                            )}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
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
        </section>

        <div className="product-catalog-layout">
          <aside className="product-category-panel">
            <div className="product-panel-title">{t.categories[language]}</div>
            <button
              type="button"
              className={`product-category-button ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span>{t.allCategories[language]}</span>
              <strong>{products.length}</strong>
            </button>
            {categoryOptions.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`product-category-button ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span>{category.name}</span>
                <strong>{category.count}</strong>
              </button>
            ))}
            <button type="button" className="product-reset-button" onClick={resetFilters}>
              {t.reset[language]}
            </button>
          </aside>

          <section className="product-catalog-main">
            <div className="product-results-bar">
              <div>
                <strong>{filteredProducts.length}</strong> {t.results[language]}
              </div>
              <div className="product-per-page">
                {t.perPage[language]}: <strong>{PER_PAGE}</strong>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="product-empty-state">{t.noMatches[language]}</div>
            ) : (
              <>
                <div className="product-grid">
                  {paginatedProducts.map((product) => {
                    const imageUrl = getImageUrl(product.image);
                    const hasImage = imageUrl && !imageErrors[product.id];

                    return (
                      <Link key={product.id} to={`/products/${product.id}`} className="product-card">
                        <div className="product-card-media">
                          {hasImage ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              onError={() => setImageErrors((current) => ({ ...current, [product.id]: true }))}
                            />
                          ) : (
                            <div className="product-image-fallback">{getInitials(product.name)}</div>
                          )}
                          <span className={`product-stock-badge ${Number(product.stock) > 0 ? 'in' : 'out'}`}>
                            {Number(product.stock) > 0 ? t.inStock[language] : t.outOfStock[language]}
                          </span>
                        </div>
                        <div className="product-card-body">
                          <div className="product-card-category">
                            {product.category?.name || t.category[language]}
                          </div>
                          <h3>{product.name}</h3>
                          <p>{product.description || t.noDescription[language]}</p>
                          <div className="product-card-footer">
                            <span>${Number(product.price || 0).toFixed(2)}</span>
                            <small>{t.view[language]}</small>
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
    </div>
  );
}
