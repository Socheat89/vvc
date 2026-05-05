import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalStock: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState([]);
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

      const products = productsRes.data.data;
      const categories = categoriesRes.data.data;

      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const lowStock = products.filter(p => p.stock < 10).length;

      setStats({
        totalProducts: products.length,
        totalCategories: categories.length,
        totalStock,
        lowStock,
      });

      setRecentProducts(products.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>{t.loading[language]}</div>;

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8">{t.title[language]}</h1>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <div className="glass-card rounded-3xl p-6">
          <div className="text-3xl font-semibold text-[var(--ember)]">{stats.totalProducts}</div>
          <div className="mt-2 text-sm text-slate-600">{t.totalProducts[language]}</div>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <div className="text-3xl font-semibold text-[var(--teal)]">{stats.totalCategories}</div>
          <div className="mt-2 text-sm text-slate-600">{t.categories[language]}</div>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <div className="text-3xl font-semibold text-slate-800">{stats.totalStock}</div>
          <div className="mt-2 text-sm text-slate-600">{t.totalStock[language]}</div>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <div className="text-3xl font-semibold text-rose-600">{stats.lowStock}</div>
          <div className="mt-2 text-sm text-slate-600">{t.lowStock[language]}</div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="glass-card rounded-3xl">
        <div className="border-b border-white/60 px-6 py-4">
          <h2 className="text-xl font-semibold">{t.recentProducts[language]}</h2>
        </div>
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">{t.name[language]}</th>
                <th className="text-left py-2 px-4">{t.price[language]}</th>
                <th className="text-left py-2 px-4">{t.stock[language]}</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map(product => (
                <tr key={product.id} className="border-b border-white/60 hover:bg-white/60">
                  <td className="py-2 px-4">{product.name}</td>
                  <td className="py-2 px-4">${parseFloat(product.price).toFixed(2)}</td>
                  <td className="py-2 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      product.stock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
