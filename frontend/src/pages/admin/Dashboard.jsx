import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const t = translations.dashboard;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);

      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      setError(null);
    } catch (err) {
      setError(t.loadError[language]);
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
    const lowStock = products.filter(product => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock < 10;
    }).length;
    const outOfStock = products.filter(product => Number(product.stock || 0) === 0).length;
    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0),
      0
    );
    const healthyStock = products.filter(product => Number(product.stock || 0) >= 10).length;

    return {
      totalProducts: products.length,
      totalCategories: categories.length,
      totalStock,
      lowStock,
      outOfStock,
      healthyStock,
      inventoryValue,
    };
  }, [categories.length, products]);

  const recentProducts = useMemo(
    () => [...products].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5),
    [products]
  );

  const categoryMix = useMemo(() => {
    return categories.map((category) => {
      const count = products.filter(product => Number(product.category_id) === Number(category.id)).length;
      const percentage = products.length ? Math.round((count / products.length) * 100) : 0;
      return { ...category, count, percentage };
    });
  }, [categories, products]);

  const stockAlerts = useMemo(
    () => products
      .filter(product => Number(product.stock || 0) < 10)
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 5),
    [products]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded bg-white/70" />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="h-32 animate-pulse rounded-lg bg-white/70" />
          <div className="h-32 animate-pulse rounded-lg bg-white/70" />
          <div className="h-32 animate-pulse rounded-lg bg-white/70" />
          <div className="h-32 animate-pulse rounded-lg bg-white/70" />
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-white/70" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="pill">{t.eyebrow[language]}</span>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t.title[language]}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{t.subtitle[language]}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchStats}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t.refresh[language]}
          </button>
          <Link to="/admin/products" className="btn-primary">
            {t.manageProducts[language]}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 reveal">
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.totalProducts[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalProducts}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.categories[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--gold-deep)]">{stats.totalCategories}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.totalStock[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalStock}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.lowStock[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-amber-700">{stats.lowStock}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.inventoryValue[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--gold)]">
            ${stats.inventoryValue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] reveal reveal-delay-1">
        <div className="glass-card overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg">
          <div className="border-b border-white/70 px-5 py-4">
            <h2 className="text-xl font-semibold text-slate-900">{t.recentProducts[language]}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-white/70 bg-white/70">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.name[language]}</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.price[language]}</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.stock[language]}</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.status[language]}</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map(product => {
                  const status =
                    Number(product.stock || 0) === 0
                      ? { label: t.outOfStockLabel[language], className: 'bg-yellow-100 text-yellow-800' }
                      : Number(product.stock || 0) < 10
                        ? { label: t.lowStockLabel[language], className: 'bg-amber-100 text-amber-800' }
                        : { label: t.inStock[language], className: 'bg-yellow-100 text-yellow-800' };

                  return (
                    <tr key={product.id} className="border-b border-white/70 transition hover:bg-white/60">
                      <td className="px-5 py-4 font-semibold text-slate-900">{product.name}</td>
                      <td className="px-5 py-4">${Number(product.price || 0).toFixed(2)}</td>
                      <td className="px-5 py-4">{product.stock}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {recentProducts.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-600">{t.noProducts[language]}</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900">{t.stockHealth[language]}</h2>
            <div className="mt-5 space-y-3">
              <div>
                <div className="mb-2 flex justify-between text-sm text-slate-600">
                  <span>{t.healthyStock[language]}</span>
                  <span>{stats.healthyStock}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[var(--gold-deep)]"
                    style={{ width: `${products.length ? (stats.healthyStock / products.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm text-slate-600">
                  <span>{t.needsAttention[language]}</span>
                  <span>{stats.lowStock + stats.outOfStock}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[var(--gold)]"
                    style={{
                      width: `${
                        products.length ? ((stats.lowStock + stats.outOfStock) / products.length) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900">{t.categoryMix[language]}</h2>
            <div className="mt-5 space-y-4">
              {categoryMix.map(category => (
                <div key={category.id}>
                  <div className="mb-2 flex justify-between text-sm text-slate-600">
                    <span>{category.name}</span>
                    <span>{category.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[var(--gold)]"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {categoryMix.length === 0 && (
                <p className="text-sm text-slate-600">{t.noCategories[language]}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {stockAlerts.length > 0 && (
        <div className="glass-card rounded-2xl p-5 reveal reveal-delay-2 transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{t.needsAttention[language]}</h2>
            <Link to="/admin/products" className="text-sm font-semibold text-[var(--gold-deep)] hover:text-[var(--gold-deep)]">
              {t.viewAll[language]}
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {stockAlerts.map(product => (
              <div key={product.id} className="rounded-lg border border-white/80 bg-white/70 p-4">
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {product.stock} {t.stock[language]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
