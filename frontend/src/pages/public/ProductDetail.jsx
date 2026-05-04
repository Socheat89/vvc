import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import ProductImage from '../../components/ProductImage';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const t = translations.productDetail;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getById(id);
      setProduct(response.data.data);
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
  if (!product) return <div className="mx-auto max-w-6xl px-4 py-16">{t.notFound[language]}</div>;

  return (
    <div className="mesh-bg">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Link to="/products" className="text-sm uppercase tracking-[0.3em] text-slate-500">
          {t.backToProducts[language]}
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div className="glass-card overflow-hidden rounded-3xl">
            <ProductImage
              src={product.image}
              name={product.name}
              category={product.category?.name}
              alt={product.name}
              className="h-full min-h-[22rem] w-full object-cover"
              loading="eager"
            />
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-semibold md:text-5xl">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-3xl font-semibold text-[var(--ember)]">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  product.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {product.stock > 0
                  ? `${product.stock} ${t.inStock[language]}`
                  : t.outOfStock[language]}
              </span>
            </div>

            {product.category && (
              <p className="text-sm text-slate-600">
                {t.category[language]}: <span className="font-semibold text-slate-800">{product.category.name}</span>
              </p>
            )}

            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-2xl font-semibold">{t.productDetails[language]}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>
            </div>

            <button
              disabled={product.stock === 0}
              className={`w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
                product.stock > 0
                  ? 'bg-[var(--teal)] hover:brightness-110'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {product.stock > 0 ? t.reserve[language] : t.outOfStock[language]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
