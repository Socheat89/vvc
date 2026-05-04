import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import ProductImage from '../../components/ProductImage';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const t = translations.productList;
  const itemsPerPage = 6;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      const items = Array.isArray(response?.data?.data) ? response.data.data : [];
      setProducts(items);
      setError(null);
    } catch (err) {
      setProducts([]);
      setError(t.loadError[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryService.getAll();
      const items = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCategories(items);
    } catch (err) {
      setCategories([]);
      console.error(err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const categoryFilteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((product) => {
        const productCategoryId = product.category?.id ?? product.category_id;
        return String(productCategoryId ?? '') === selectedCategory;
      });

  const normalizedSearchTerm = searchDraft.trim().toLowerCase();
  const filteredProducts = normalizedSearchTerm
    ? categoryFilteredProducts.filter((product) => {
        const name = String(product.name ?? '').toLowerCase();
        const description = String(product.description ?? '').toLowerCase();
        const categoryName = String(product.category?.name ?? '').toLowerCase();
        return name.includes(normalizedSearchTerm)
          || description.includes(normalizedSearchTerm)
          || categoryName.includes(normalizedSearchTerm);
      })
    : categoryFilteredProducts;

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * itemsPerPage;
  const pagedProducts = filteredProducts.slice(pageStartIndex, pageStartIndex + itemsPerPage);

  const activeCategoryLabel = selectedCategory === 'all'
    ? t.allCategories[language]
    : categories.find((category) => String(category.id) === selectedCategory)?.name
      || t.allCategories[language];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setCurrentPage(safePage);
  };

  const getPageItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items = [1];
    const left = Math.max(2, activePage - 1);
    const right = Math.min(totalPages - 1, activePage + 1);

    if (left > 2) items.push('ellipsis-left');
    for (let page = left; page <= right; page += 1) {
      items.push(page);
    }
    if (right < totalPages - 1) items.push('ellipsis-right');
    items.push(totalPages);

    return items;
  };

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-16">{t.loading[language]}</div>;
  if (error)   return <div className="mx-auto max-w-6xl px-4 py-16 text-red-600">{error}</div>;

  return (
    <div className="mesh-bg">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{t.tagline[language]}</p>
            <h1 className="section-title mt-4">{t.title[language]}</h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-600">{t.desc[language]}</p>
            <div className="mt-6 flex w-full max-w-xl items-center gap-2 rounded-full border border-white/60 bg-white/80 px-2 py-2">
              <input
                value={searchDraft}
                onChange={(event) => {
                  setSearchDraft(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t.searchPlaceholder[language]}
                className="flex-1 bg-transparent px-3 text-sm text-slate-700 outline-none"
                type="search"
              />
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="inline-flex h-10 items-center rounded-full border border-white/70 bg-white/80 px-4 text-sm text-slate-600 transition hover:bg-white/90"
            >
              {t.filterButton[language]}
            </button>
            <span className="inline-flex h-10 items-center rounded-full border border-white/70 bg-white/80 px-4 text-sm font-semibold text-[var(--teal)]">
              {activeCategoryLabel}
            </span>
            <span className="inline-flex h-10 items-center rounded-full border border-white/70 bg-white/80 px-4 text-sm text-slate-600">
              {t.newestFirst[language]}
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside
            className={`lg:sticky lg:top-24 lg:self-start ${filtersOpen ? 'block' : 'hidden'} lg:block`}
          >
            <div className="glass-card rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t.categoriesTitle[language]}</p>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:max-h-[60vh] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm transition lg:w-full lg:text-left ${
                    selectedCategory === 'all'
                      ? 'bg-[var(--teal)]/10 font-semibold text-[var(--teal)]'
                      : 'text-slate-600 hover:bg-white/70'
                  }`}
                >
                  {t.allProducts[language]}
                </button>
                {categoriesLoading ? (
                  <span className="flex items-center px-4 text-xs text-slate-500">
                    {t.loadingCategories[language]}
                  </span>
                ) : categories.length === 0 ? (
                  <span className="flex items-center px-4 text-xs text-slate-500">
                    {t.noCategories[language]}
                  </span>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategorySelect(String(category.id))}
                      className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm transition lg:w-full lg:text-left ${
                        selectedCategory === String(category.id)
                          ? 'bg-[var(--teal)]/10 font-semibold text-[var(--teal)]'
                          : 'text-slate-600 hover:bg-white/70'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <div>
            {filteredProducts.length === 0 ? (
              <p className="text-center text-slate-600">{t.noProducts[language]}</p>
            ) : (
              <div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pagedProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="glass-card group overflow-hidden rounded-3xl transition hover:-translate-y-1"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <ProductImage
                          src={product.image}
                          name={product.name}
                          category={product.category?.name}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs text-slate-600">
                          {product.stock > 0 ? t.inStock[language] : t.outOfStock[language]}
                        </div>
                      </div>
                      <div className="space-y-3 p-6">
                        <h3 className="text-2xl font-semibold text-slate-800">{product.name}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-semibold text-[var(--ember)]">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{t.view[language]}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600">
                    <button
                      type="button"
                      onClick={() => handlePageChange(activePage - 1)}
                      disabled={activePage === 1}
                      className={`rounded-full border border-white/70 px-4 py-2 transition ${
                        activePage === 1
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-white/80'
                      }`}
                    >
                      {t.previousPage[language]}
                    </button>

                    {getPageItems().map((item) => {
                      if (typeof item !== 'number') {
                        return (
                          <span key={item} className="px-2 text-slate-400">
                            ...
                          </span>
                        );
                      }

                      const isActive = item === activePage;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handlePageChange(item)}
                          className={`h-9 min-w-[36px] rounded-full px-3 text-sm transition ${
                            isActive
                              ? 'bg-[var(--teal)]/15 font-semibold text-[var(--teal)]'
                              : 'border border-white/70 text-slate-600 hover:bg-white/80'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handlePageChange(activePage + 1)}
                      disabled={activePage === totalPages}
                      className={`rounded-full border border-white/70 px-4 py-2 transition ${
                        activePage === totalPages
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-white/80'
                      }`}
                    >
                      {t.nextPage[language]}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
