import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import { getProductDisplayName } from '../../utils/productDisplay';

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
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded bg-slate-200/60" />
        <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl glass-card" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="h-80 animate-pulse rounded-2xl glass-card" />
          <div className="h-80 animate-pulse rounded-2xl glass-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
        <svg className="mx-auto h-8 w-8 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="font-semibold">{error}</p>
        <button onClick={fetchStats} className="mt-4 text-sm underline hover:text-red-800">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-[var(--stroke)]">
        <div>
          <span className="inline-block px-3 py-1 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-deep)] bg-[var(--gold-soft)] shadow-sm rounded-full">
            {t.eyebrow[language]}
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink)]">{t.title[language]}</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">{t.subtitle[language]}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchStats}
            className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {t.refresh[language]}
          </button>
          <Link to="/admin/products" className="flex items-center gap-2 rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-sm font-semibold shadow-[0_4px_14px_rgba(199,154,45,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(199,154,45,0.6)] hover:-translate-y-0.5 active:translate-y-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            {t.manageProducts[language]}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-5 reveal">
        <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col justify-between group">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.totalProducts[language]}</p>
            <p className="text-3xl font-bold tracking-tight text-[var(--ink)]">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col justify-between group">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.categories[language]}</p>
            <p className="text-3xl font-bold tracking-tight text-indigo-600">{stats.totalCategories}</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col justify-between group justify-between">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.totalStock[language]}</p>
            <p className="text-3xl font-bold tracking-tight text-emerald-600">{stats.totalStock}</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col justify-between group">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.lowStock[language]}</p>
            <p className="text-3xl font-bold tracking-tight text-orange-500">{stats.lowStock}</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col justify-between group col-span-2 lg:col-span-1 border-[var(--gold)] border-opacity-30">
          <div className="w-10 h-10 rounded-2xl bg-[var(--gold-soft)] flex items-center justify-center text-[var(--gold-deep)] group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.inventoryValue[language]}</p>
            <p className="text-3xl font-bold tracking-tight text-[var(--gold-deep)]">
              <span className="text-base font-medium opacity-70 align-top mr-1">$</span>
              {stats.inventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr] reveal reveal-delay-1">
        {/* Table Section */}
        <div className="glass-card overflow-hidden rounded-3xl flex flex-col hover:shadow-lg transition-shadow duration-300">
          <div className="border-b border-[var(--stroke)] px-6 py-5 flex items-center justify-between bg-white/50">
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {t.recentProducts[language]}
            </h2>
            <Link to="/admin/products" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">View All →</Link>
          </div>
          <div className="overflow-x-auto flex-1 bg-white/30">
            <table className="w-full min-w-[640px] text-sm text-left">
              <thead className="bg-slate-50/50 border-b border-[var(--stroke)]">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">{t.name[language]}</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">{t.price[language]}</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">{t.stock[language]}</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">{t.status[language]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--stroke)]">
                {recentProducts.map(product => {
                  const productName = getProductDisplayName(product, language);
                  const status =
                    Number(product.stock || 0) === 0
                      ? { label: t.outOfStockLabel[language], bg: 'bg-rose-50', text: 'text-rose-600' }
                      : Number(product.stock || 0) < 10
                        ? { label: t.lowStockLabel[language], bg: 'bg-orange-50', text: 'text-orange-600' }
                        : { label: t.inStock[language], bg: 'bg-emerald-50', text: 'text-emerald-600' };

                  return (
                    <tr key={product.id} className="transition-colors hover:bg-slate-50/70 group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{productName}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">${Number(product.price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{product.stock}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}>
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
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <p className="text-slate-500">{t.noProducts[language]}</p>
            </div>
          )}
        </div>

        {/* Aside Charts Section */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:shadow-lg">
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink)] flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              {t.stockHealth[language]}
            </h2>
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm font-semibold">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{t.healthyStock[language]}</span>
                  <span className="text-slate-700">{stats.healthyStock}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden relative">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${products.length ? (stats.healthyStock / products.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm font-semibold">
                  <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">{t.needsAttention[language]}</span>
                  <span className="text-slate-700">{stats.lowStock + stats.outOfStock}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden relative">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-orange-500 transition-all duration-1000 ease-out"
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

          <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:shadow-lg">
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink)] flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              {t.categoryMix[language]}
            </h2>
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
              {categoryMix.map((category, idx) => (
                <div key={category.id}>
                  <div className="mb-1.5 flex justify-between text-sm font-medium text-slate-700">
                    <span className="truncate mr-4">{category.name}</span>
                    <span className="text-slate-400 font-bold">{category.count} <span className="text-xs font-normal">({category.percentage}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden relative border border-white">
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: `hsl(${idx * 45}, 70%, 55%)` // Dynamic color based on index
                      }}
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
                <p className="font-semibold text-slate-900">{getProductDisplayName(product, language)}</p>
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
