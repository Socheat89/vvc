import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    category_id: '',
  });

  const { language } = useLanguage();
  const t = translations.manageProducts;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
      setFormError(null);
    } catch (err) {
      setFormError(language === 'kh' ? 'បរាជ័យក្នុងការផ្ទុកទិន្នន័យ' : 'Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', stock: '', image: '', category_id: '' });
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image: product.image,
      category_id: product.category_id || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setFormError(null);
      if (editingId) {
        await productService.update(editingId, formData);
      } else {
        await productService.create(formData);
      }
      await fetchData();
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || (language === 'kh' ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save product'));
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t.deleteConfirm[language])) {
      try {
        await productService.delete(id);
        await fetchData();
      } catch (err) {
        setFormError(language === 'kh' ? 'បរាជ័យក្នុងការលុប' : 'Failed to delete product');
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormError(null);
  };

  if (loading) return <div>{t.loading[language]}</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-semibold">{t.title[language]}</h1>
        <button onClick={handleAdd} className="btn-primary">
          + {t.addProduct[language]}
        </button>
      </div>

      {formError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass-card mb-8 rounded-3xl p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {editingId ? t.editTitle[language] : t.addTitle[language]}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2">{t.name[language]} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm focus:border-[var(--ember)] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t.price[language]} *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm focus:border-[var(--ember)] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2">{t.stock[language]} *</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm focus:border-[var(--ember)] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t.category[language]}</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm focus:border-[var(--ember)] focus:outline-none"
                >
                  <option value="">
                    {language === 'kh' ? '-- ជ្រើសប្រភេទ --' : '-- Select Category --'}
                  </option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t.description[language]} *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm focus:border-[var(--ember)] focus:outline-none"
                rows="4"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t.image[language]}</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm focus:border-[var(--ember)] focus:outline-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="rounded-full bg-[var(--teal)] px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {t.save[language]}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
              >
                {t.cancel[language]}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="glass-card overflow-hidden rounded-3xl">
        <table className="w-full text-sm">
          <thead className="bg-white/70 border-b border-white/60">
            <tr>
              <th className="text-left py-4 px-6">{t.name[language]}</th>
              <th className="text-left py-4 px-6">{t.price[language]}</th>
              <th className="text-left py-4 px-6">{t.stock[language]}</th>
              <th className="text-left py-4 px-6">{t.category[language]}</th>
              <th className="text-left py-4 px-6">{t.actions[language]}</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b border-white/60 hover:bg-white/60">
                <td className="py-4 px-6 font-semibold text-slate-800">{product.name}</td>
                <td className="py-4 px-6">${parseFloat(product.price).toFixed(2)}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    product.stock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-4 px-6">{product.category?.name || '-'}</td>
                <td className="py-4 px-6">
                  <button
                    onClick={() => handleEdit(product)}
                    className="mr-4 text-sm font-semibold text-[var(--teal)] hover:text-emerald-700"
                  >
                    {t.edit[language]}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-sm font-semibold text-rose-600 hover:text-rose-800"
                  >
                    {t.delete[language]}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="py-8 text-center text-slate-600">
            {t.noProducts[language]}.{' '}
            <button onClick={handleAdd} className="text-[var(--ember)] hover:underline">
              {t.addProduct[language]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
