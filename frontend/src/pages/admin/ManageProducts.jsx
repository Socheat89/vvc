import React, { useEffect, useMemo, useRef, useState } from 'react';
import { productService, categoryService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import BackgroundRemovedImage from '../../components/BackgroundRemovedImage';
import { getBackgroundRemovedImageFile } from '../../utils/backgroundRemoval';
import { getProductDisplayName } from '../../utils/productDisplay';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  image: '',
  imageFile: null,
  category_id: '',
};

const ITEMS_PER_PAGE = 10;
const stockFilters = ['all', 'inStock', 'lowStock', 'outOfStock'];
const sortOptions = ['newest', 'nameAsc', 'priceAsc', 'priceDesc', 'stockAsc', 'stockDesc'];
const PUBLIC_ASSET_BASE = 'https://app.vvc.asia/vvc_web/vvc/backend/public';
const PRODUCT_UPLOAD_BASE = `${PUBLIC_ASSET_BASE}/uploads/products`;

const extractUploadPath = (value) => {
  const normalizedValue = String(value || '').trim().replace(/\\/g, '/');
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

const getProductImageUrl = (image) => {
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

const ActionMenu = ({ onEdit, onDelete, isDeleting, language, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden border border-slate-100">
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); onEdit(); }}
              className="flex w-full items-center px-4 py-2.5 text-sm text-[var(--gold-deep)] hover:bg-[var(--gold-soft)] font-semibold transition-colors"
            >
              <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              {t.edit[language]}
            </button>
            <button
              onClick={() => { setIsOpen(false); onDelete(); }}
              disabled={isDeleting}
              className="flex w-full items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-semibold disabled:opacity-50 transition-colors"
            >
              <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {isDeleting ? t.deleting[language] : t.delete[language]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

async function buildProductPayload(data, backgroundRemoveFailedMessage) {
  const payload = {
    name: data.name.trim(),
    description: data.description.trim(),
    price: Number(data.price),
    stock: Number.parseInt(data.stock, 10),
    category_id: data.category_id ? Number(data.category_id) : null,
  };

  if (!data.imageFile) {
    return payload;
  }

  const formData = new FormData();
  let imageFile = data.imageFile;

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value === null ? '' : value);
    }
  });

  try {
    imageFile = await getBackgroundRemovedImageFile(data.imageFile, data.imageFile.name);
  } catch (error) {
    console.error(error);
    throw new Error(backgroundRemoveFailedMessage);
  }

  formData.append('image_file', imageFile, imageFile.name);

  return formData;
}

function getProductStatus(product, t, language) {
  const stock = Number(product.stock || 0);

  if (stock === 0) {
    return {
      label: t.outOfStock[language],
      className: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    };
  }

  if (stock < 10) {
    return {
      label: t.lowStockLabel[language],
      className: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    };
  }

  return {
    label: t.inStock[language],
    className: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  };
}

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [stockUpdatingId, setStockUpdatingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [backgroundRemoving, setBackgroundRemoving] = useState(false);
  const [backgroundRemovalProgress, setBackgroundRemovalProgress] = useState({
    current: 0,
    total: 0,
    failed: 0,
  });
  const [backgroundRemovalMessage, setBackgroundRemovalMessage] = useState('');
  const [showImportTip, setShowImportTip] = useState(false);
  const fileInputRef = useRef(null);

  const { language } = useLanguage();
  const t = translations.manageProducts;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchTerm, sortBy, stockFilter]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      setImageErrors({});
      setFormError(null);
    } catch (err) {
      setFormError(t.loadFailed[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalProducts = products.length;
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

    return { totalProducts, totalStock, lowStock, outOfStock, inventoryValue };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const categoryName = product.category?.name || '';
        const matchesSearch =
          !term ||
          product.name.toLowerCase().includes(term) ||
          (product.item_code || '').toLowerCase().includes(term) ||
          (product.local_name || '').toLowerCase().includes(term) ||
          (product.description || '').toLowerCase().includes(term) ||
          categoryName.toLowerCase().includes(term);

        const stock = Number(product.stock || 0);
        const matchesCategory =
          categoryFilter === 'all' || String(product.category_id || '') === categoryFilter;

        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'inStock' && stock >= 10) ||
          (stockFilter === 'lowStock' && stock > 0 && stock < 10) ||
          (stockFilter === 'outOfStock' && stock === 0);

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'nameAsc') return getProductDisplayName(a, language).localeCompare(getProductDisplayName(b, language));
        if (sortBy === 'priceAsc') return Number(a.price) - Number(b.price);
        if (sortBy === 'priceDesc') return Number(b.price) - Number(a.price);
        if (sortBy === 'stockAsc') return Number(a.stock || 0) - Number(b.stock || 0);
        if (sortBy === 'stockDesc') return Number(b.stock || 0) - Number(a.stock || 0);
        return Number(b.id) - Number(a.id);
      });
  }, [categoryFilter, products, searchTerm, sortBy, stockFilter, language]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== currentPageSafe) {
      setCurrentPage(currentPageSafe);
    }
  }, [currentPage, currentPageSafe]);

  const pageItems = useMemo(() => {
    const items = [];

    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page += 1) {
        items.push(page);
      }
      return items;
    }

    items.push(1);

    if (currentPageSafe > 3) {
      items.push('ellipsis-start');
    }

    const start = Math.max(2, currentPageSafe - 1);
    const end = Math.min(totalPages - 1, currentPageSafe + 1);

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (currentPageSafe < totalPages - 2) {
      items.push('ellipsis-end');
    }

    items.push(totalPages);

    return items;
  }, [currentPageSafe, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPageSafe, filteredProducts]);

  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setImportResult(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock ?? '',
      image: product.image || '',
      imageFile: null,
      category_id: product.category_id || '',
    });
    setImagePreview(getProductImageUrl(product.image) || null);
    setFormError(null);
    setShowForm(true);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setFormData({ ...formData, imageFile: file });

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(file ? URL.createObjectURL(file) : getProductImageUrl(formData.image) || null);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setImporting(true);
      setFormError(null);
      setImportResult(null);
      setBackgroundRemovalMessage('');
      const response = await productService.import(file);
      setImportResult(response.data);
      await fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || t.importFailed[language]);
      console.error(err);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleRemoveBackgroundForExisting = async () => {
    const productsWithImages = filteredProducts.filter((product) => getProductImageUrl(product.image));

    if (productsWithImages.length === 0 || backgroundRemoving) return;

    const confirmed = window.confirm(`${t.removeBackgroundConfirm[language]} (${productsWithImages.length})`);
    if (!confirmed) return;

    let failed = 0;

    try {
      setBackgroundRemoving(true);
      setBackgroundRemovalMessage('');
      setFormError(null);
      setBackgroundRemovalProgress({
        current: 0,
        total: productsWithImages.length,
        failed: 0,
      });

      for (let index = 0; index < productsWithImages.length; index += 1) {
        const product = productsWithImages[index];

        try {
          const transparentFile = await getBackgroundRemovedImageFile(
            getProductImageUrl(product.image),
            `product-${product.id}.png`
          );
          const payload = new FormData();
          payload.append('image_file', transparentFile, transparentFile.name);
          await productService.update(product.id, payload);
        } catch (error) {
          failed += 1;
          console.error(error);
        } finally {
          setBackgroundRemovalProgress({
            current: index + 1,
            total: productsWithImages.length,
            failed,
          });
        }
      }

      await fetchData();

      setBackgroundRemovalMessage(
        failed
          ? `${t.removeBackgroundFailed[language]} (${productsWithImages.length - failed}/${productsWithImages.length})`
          : `${t.removeBackgroundSuccess[language]} (${productsWithImages.length})`
      );
    } finally {
      setBackgroundRemoving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFormError(null);
      setBackgroundRemovalMessage('');
      const payload = await buildProductPayload(formData, t.removeBackgroundFailed[language]);

      if (editingId) {
        await productService.update(editingId, payload);
      } else {
        await productService.create(payload);
      }

      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      setImagePreview(null);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || t.saveFailed[language]);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeletingId(deleteConfirmId);
      setFormError(null);
      await productService.delete(deleteConfirmId);
      await fetchData();
    } catch (err) {
      setFormError(t.deleteFailed[language]);
      console.error(err);
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleStockChange = async (product, nextStock) => {
    const stock = Math.max(0, nextStock);

    try {
      setStockUpdatingId(product.id);
      setFormError(null);
      await productService.update(product.id, { stock });
      setProducts(current =>
        current.map(item => (item.id === product.id ? { ...item, stock } : item))
      );
    } catch (err) {
      setFormError(t.stockUpdateFailed[language]);
      console.error(err);
    } finally {
      setStockUpdatingId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setImagePreview(null);
    setFormError(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStockFilter('all');
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-white/70" />
        <div className="h-40 animate-pulse rounded-lg bg-white/70" />
        <div className="h-80 animate-pulse rounded-lg bg-white/70" />
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
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleImportClick}
            disabled={importing || backgroundRemoving}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? t.importing[language] : t.importExcel[language]}
          </button>
          <button
            type="button"
            onClick={handleRemoveBackgroundForExisting}
            disabled={backgroundRemoving || filteredProducts.every((product) => !getProductImageUrl(product.image))}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {backgroundRemoving
              ? `${t.removingBackground[language]} ${backgroundRemovalProgress.current}/${backgroundRemovalProgress.total}`
              : t.removeBackground[language]}
          </button>
          <button onClick={handleAdd} className="btn-primary">
            <span aria-hidden="true">+</span>
            {t.addProduct[language]}
          </button>
        </div>
      </div>

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {importResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t.importSuccess[language]} {t.created[language]}: {importResult.created || 0}, {t.updated[language]}:{' '}
          {importResult.updated || 0}, {t.skipped[language]}: {importResult.skipped_count || 0}
        </div>
      )}

      {backgroundRemovalMessage && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          backgroundRemovalProgress.failed > 0
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}>
          {backgroundRemovalMessage}
          {backgroundRemovalProgress.failed > 0 && (
            <span> {t.skipped[language]}: {backgroundRemovalProgress.failed}</span>
          )}
        </div>
      )}

      <div className="relative z-20 flex justify-end">
        <button
          type="button"
          onClick={() => setShowImportTip(!showImportTip)}
          className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-deep)] hover:text-[var(--gold-deep)] transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.importTitle[language]}
        </button>
        {showImportTip && (
          <div className="absolute top-full right-0 mt-2 w-80 rounded-xl bg-white p-4 shadow-xl border border-slate-100 animate-fade-in-up">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-slate-800">{t.importTitle[language]}</p>
              <button onClick={() => setShowImportTip(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{t.importHelp[language]}</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 reveal">
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.totalProducts[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalProducts}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.totalStock[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--gold-deep)]">{stats.totalStock}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.inventoryValue[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--ember)]">
            ${stats.inventoryValue.toFixed(2)}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.lowStock[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-amber-700">{stats.lowStock}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.outOfStock[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-rose-700">{stats.outOfStock}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[var(--ink)]/40 backdrop-blur-sm page-fade">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 shadow-2xl reveal">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingId ? t.editTitle[language] : t.addTitle[language]}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{t.formHelp[language]}</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <span aria-hidden="true" className="text-xl leading-none">&times;</span>
              </button>
            </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">{t.name[language]} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">{t.category[language]}</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
                >
                  <option value="">{t.selectCategory[language]}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700">{t.price[language]} *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">{t.stock[language]} *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">{t.imageUpload[language]}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[var(--gold-deep)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[var(--ember)]"
                />
                <p className="mt-2 text-xs text-slate-500">{t.imageUploadHelp[language]}</p>
                {imagePreview && (
                  <div className="mt-3 h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <BackgroundRemovedImage
                      src={imagePreview}
                      alt={formData.name || t.imageUpload[language]}
                      className="h-full w-full object-contain p-1.5"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">{t.description[language]} *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-[var(--ember)]"
                rows="4"
                required
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200/50 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
              >
                {saving ? t.saving[language] : t.save[language]}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel[language]}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/40 backdrop-blur-sm page-fade">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl reveal">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 mb-4">
                <svg className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{t.deleteConfirm[language]}</h3>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex justify-center rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                {t.delete[language]}
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel[language]}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 reveal reveal-delay-1 transition-all duration-300 hover:shadow-lg">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="sr-only">{t.search[language]}</label>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder[language]}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
            aria-label={t.category[language]}
          >
            <option value="all">{t.allCategories[language]}</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
            aria-label={t.stockStatus[language]}
          >
            {stockFilters.map(filter => (
              <option key={filter} value={filter}>{t.stockFilters[filter][language]}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
            aria-label={t.sortBy[language]}
          >
            {sortOptions.map(option => (
              <option key={option} value={option}>{t.sortOptions[option][language]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t.reset[language]}
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl reveal reveal-delay-2 transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/70 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t.inventory[language]}</h2>
            <p className="text-sm text-slate-600">
              {filteredProducts.length} {t.results[language]}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t.refresh[language]}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b border-white/70 bg-white/70">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.product[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.category[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.price[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.stock[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.status[language]}</th>
                <th className="px-5 py-4 text-right font-semibold text-slate-600">{t.actions[language]}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => {
                const status = getProductStatus(product, t, language);
                const stock = Number(product.stock || 0);
                const isStockBusy = stockUpdatingId === product.id;
                const isDeleting = deletingId === product.id;
                const productName = getProductDisplayName(product, language);
                const productImageUrl = getProductImageUrl(product.image);
                const hasProductImage = productImageUrl && !imageErrors[product.id];

                return (
                  <tr key={product.id} className="border-b border-white/70 transition hover:bg-white/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          {hasProductImage ? (
                            <BackgroundRemovedImage
                              src={productImageUrl}
                              alt={productName}
                              className="h-full w-full object-contain p-1"
                              onError={() => setImageErrors((current) => ({ ...current, [product.id]: true }))}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                              VVC
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{productName}</p>
                          {product.item_code && (
                            <p className="mt-1 text-xs font-semibold text-[var(--gold-deep)]">
                              {t.itemCode[language]}: {product.item_code}
                            </p>
                          )}
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{product.category?.name || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      ${Number(product.price || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex w-fit items-center rounded-full border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => handleStockChange(product, stock - 1)}
                          disabled={isStockBusy || stock === 0}
                          className="h-9 w-9 rounded-full text-lg leading-none text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={t.decreaseStock[language]}
                        >
                          -
                        </button>
                        <span className="min-w-10 px-2 text-center font-semibold text-slate-800">
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStockChange(product, stock + 1)}
                          disabled={isStockBusy}
                          className="h-9 w-9 rounded-full text-lg leading-none text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={t.increaseStock[language]}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionMenu 
                          onEdit={() => handleEdit(product)}
                          onDelete={() => handleDelete(product.id)}
                          isDeleting={isDeleting}
                          language={language}
                          t={t}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length > 0 && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 bg-white/70 px-5 py-4 text-sm">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {t.page[language]} {currentPageSafe} {t.of[language]} {totalPages}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPageSafe === 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.prev[language]}
              </button>

              <div className="flex items-center gap-1">
                {pageItems.map((item) =>
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-9 w-9 rounded-full text-xs font-semibold transition ${
                        item === currentPageSafe
                          ? 'bg-[var(--ink)] text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="px-2 text-xs text-slate-400">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPageSafe === totalPages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.next[language]}
              </button>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-slate-800">{t.noProducts[language]}</p>
            <p className="mt-2 text-sm text-slate-600">{t.noProductsHelp[language]}</p>
            <button onClick={handleAdd} className="mt-5 btn-primary">
              <span aria-hidden="true">+</span>
              {t.addProduct[language]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
