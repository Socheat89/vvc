import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const t = translations.productList;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      setProducts(response.data.data);
      setError(null);
    } catch (err) {
      setError(t.loadError[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-white/80 px-4 py-2">{t.allCategories[language]}</span>
            <span className="rounded-full border border-white/60 px-4 py-2">{t.newestFirst[language]}</span>
          </div>
        </div>

        <div className="mt-12">
          {products.length === 0 ? (
            <p className="text-center text-slate-600">{t.noProducts[language]}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="glass-card group overflow-hidden rounded-3xl transition hover:-translate-y-1"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={product.image}
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
          )}
        </div>
      </div>
    </div>
  );
}
