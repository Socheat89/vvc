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
  brand: '',
};

const ITEMS_PER_PAGE = 10;
const stockFilters = ['all', 'inStock', 'lowStock', 'outOfStock'];
const sortOptions = ['newest', 'nameAsc', 'priceAsc', 'priceDesc', 'stockAsc', 'stockDesc'];
const PUBLIC_ASSET_BASE = 'https://vvc.asia/backend/public';
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
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onEdit}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-[var(--gold-deep)] hover:bg-[var(--gold-soft)] hover:border-[var(--gold)]/30 shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
        title={t.edit[language]}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm transition-all duration-150 disabled:opacity-50 hover:scale-105 active:scale-95"
        title={isDeleting ? t.deleting[language] : t.delete[language]}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

async function buildProductPayload(data, backgroundRemoveFailedMessage) {
  const payload = {
    name: data.name.trim(),
    description: data.description.trim(),
    brand: String(data.brand || '').trim() || null,
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
      className: 'bg-rose-50 text-rose-700 border border-rose-100',
    };
  }

  if (stock < 10) {
    return {
      label: t.lowStockLabel[language],
      className: 'bg-amber-50 text-amber-700 border border-amber-100',
    };
  }

  return {
    label: t.inStock[language],
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
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
  const [brandFilter, setBrandFilter] = useState('all');
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
  }, [brandFilter, categoryFilter, searchTerm, sortBy, stockFilter]);

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

  const brandOptions = useMemo(() => {
    const brandMap = new Map();

    products.forEach((product) => {
      const brand = String(product.brand || '').trim();
      if (!brand) return;

      const key = brand.toLowerCase();
      const existing = brandMap.get(key) || { key, name: brand, count: 0 };
      existing.count += 1;
      brandMap.set(key, existing);
    });

    return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const categoryName = product.category?.name || '';
        const brandName = String(product.brand || '').trim();
        const matchesSearch =
          !term ||
          product.name.toLowerCase().includes(term) ||
          (product.item_code || '').toLowerCase().includes(term) ||
          (product.local_name || '').toLowerCase().includes(term) ||
          brandName.toLowerCase().includes(term) ||
          (product.description || '').toLowerCase().includes(term) ||
          categoryName.toLowerCase().includes(term);

        const stock = Number(product.stock || 0);
        const matchesCategory =
          categoryFilter === 'all' || String(product.category_id || '') === categoryFilter;
        const matchesBrand =
          brandFilter === 'all' || brandName.toLowerCase() === brandFilter;

        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'inStock' && stock >= 10) ||
          (stockFilter === 'lowStock' && stock > 0 && stock < 10) ||
          (stockFilter === 'outOfStock' && stock === 0);

        return matchesSearch && matchesCategory && matchesBrand && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'nameAsc') return getProductDisplayName(a, language).localeCompare(getProductDisplayName(b, language));
        if (sortBy === 'priceAsc') return Number(a.price) - Number(b.price);
        if (sortBy === 'priceDesc') return Number(b.price) - Number(a.price);
        if (sortBy === 'stockAsc') return Number(a.stock || 0) - Number(b.stock || 0);
        if (sortBy === 'stockDesc') return Number(b.stock || 0) - Number(a.stock || 0);
        return Number(b.id) - Number(a.id);
      });
  }, [brandFilter, categoryFilter, products, searchTerm, sortBy, stockFilter, language]);

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
      brand: product.brand || '',
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
    let firstFailureReason = '';

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
          if (!firstFailureReason) {
            firstFailureReason = error?.message || String(error);
          }
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
          ? `${t.removeBackgroundFailed[language]} (${productsWithImages.length - failed}/${productsWithImages.length})${firstFailureReason ? `: ${firstFailureReason}` : ''}`
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
    setBrandFilter('all');
    setStockFilter('all');
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-56 rounded bg-slate-200/60" />
        <div className="grid gap-6 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
          ))}
        </div>
        <div className="h-14 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
        <div className="h-96 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div>
          <span className="inline-block px-3 py-1 mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-deep)] bg-[var(--gold-soft)] shadow-sm rounded-full">
            {t.eyebrow[language]}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t.title[language]}</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">{t.subtitle[language]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {importing ? t.importing[language] : t.importExcel[language]}
          </button>
          
          <button
            type="button"
            onClick={handleRemoveBackgroundForExisting}
            disabled={backgroundRemoving || filteredProducts.every((product) => !getProductImageUrl(product.image))}
            className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" />
            </svg>
            {backgroundRemoving
              ? `${t.removingBackground[language]} ${backgroundRemovalProgress.current}/${backgroundRemovalProgress.total}`
              : t.removeBackground[language]}
          </button>
          
          <button 
            onClick={handleAdd} 
            className="flex items-center gap-2 rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(199,154,45,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(199,154,45,0.6)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="text-sm font-light">+</span>
            {t.addProduct[language]}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2 items-center">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      {importResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex gap-2 items-center">
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-bold">{t.importSuccess[language]}</span>
            <span className="ml-2">
              {t.created[language]}: {importResult.created || 0} | {t.updated[language]}: {importResult.updated || 0} | {t.skipped[language]}: {importResult.skipped_count || 0}
            </span>
          </div>
        </div>
      )}

      {backgroundRemovalMessage && (
        <div className={`rounded-xl border p-4 text-sm flex gap-2 items-center ${
          backgroundRemovalProgress.failed > 0
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span>{backgroundRemovalMessage}</span>
            {backgroundRemovalProgress.failed > 0 && (
              <span className="font-semibold ml-2">({t.skipped[language]}: {backgroundRemovalProgress.failed})</span>
            )}
          </div>
        </div>
      )}

      {/* Info Tip */}
      <div className="relative flex justify-end">
        <button
          type="button"
          onClick={() => setShowImportTip(!showImportTip)}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--gold-deep)] hover:text-[var(--gold)] transition whitespace-nowrap"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.importTitle[language]}
        </button>
        {showImportTip && (
          <div className="absolute top-full right-0 mt-3 w-80 rounded-2xl bg-white p-5 shadow-xl border border-slate-100 z-30 animate-fade-in-up">
            <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800">{t.importTitle[language]}</p>
              <button onClick={() => setShowImportTip(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{t.importHelp[language]}</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-5 reveal">
        <div className="glass-card rounded-2xl p-5 transition hover:shadow-md bg-white/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.totalProducts[language]}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-800">{stats.totalProducts}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition hover:shadow-md bg-white/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.totalStock[language]}</p>
          <p className="mt-4 text-3xl font-semibold text-[var(--gold-deep)]">{stats.totalStock}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition hover:shadow-md bg-white/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.inventoryValue[language]}</p>
          <p className="mt-4 text-3xl font-semibold text-[var(--ember)]">
            ${stats.inventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition hover:shadow-md bg-white/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.lowStock[language]}</p>
          <p className="mt-4 text-3xl font-semibold text-amber-700">{stats.lowStock}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 transition hover:shadow-md bg-white/70 col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.outOfStock[language]}</p>
          <p className="mt-4 text-3xl font-semibold text-rose-700">{stats.outOfStock}</p>
        </div>
      </div>

      {/* Control Bar (Filters & Search) */}
      <div className="glass-card rounded-2xl p-4 bg-white/80 border border-slate-100/60 shadow-sm reveal reveal-delay-1">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder[language]}
              className="w-full rounded-xl border border-slate-200 bg-white/80 pl-10 pr-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
            aria-label={t.category[language]}
          >
            <option value="all">{t.allCategories[language]}</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
          
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
            aria-label={t.brand[language]}
          >
            <option value="all">{t.allBrands[language]}</option>
            {brandOptions.map((brand) => (
              <option key={brand.key} value={brand.key}>{brand.name}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
            aria-label={t.stockStatus[language]}
          >
            {stockFilters.map(filter => (
              <option key={filter} value={filter}>{t.stockFilters[filter][language]}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
            aria-label={t.sortBy[language]}
          >
            {sortOptions.map(option => (
              <option key={option} value={option}>{t.sortOptions[option][language]}</option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
          >
            {t.reset[language]}
          </button>
        </div>
      </div>

      {/* Main Inventory Card */}
      <div className="glass-card overflow-hidden rounded-2xl bg-white/80 border border-slate-100/60 shadow-sm reveal reveal-delay-2">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">{t.inventory[language]}</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {filteredProducts.length} {t.results[language]}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
          >
            {t.refresh[language]}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="border-b border-white/70 bg-white/70">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.product[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.category[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.brand[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.price[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.stock[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.status[language]}</th>
                <th className="px-5 py-4 text-right font-semibold text-slate-600">{t.actions[language]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((product) => {
                const status = getProductStatus(product, t, language);
                const stock = Number(product.stock || 0);
                const isStockBusy = stockUpdatingId === product.id;
                const isDeleting = deletingId === product.id;
                const productName = getProductDisplayName(product, language);
                const productImageUrl = getProductImageUrl(product.image);
                const hasProductImage = productImageUrl && !imageErrors[product.id];

                return (
                  <tr key={product.id} className="transition hover:bg-slate-50/30 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm flex-shrink-0 group-hover:scale-[1.03] transition duration-200">
                          {hasProductImage ? (
                            <BackgroundRemovedImage
                              src={productImageUrl}
                              alt={productName}
                              className="h-full w-full object-contain p-1.5"
                              onError={() => setImageErrors((current) => ({ ...current, [product.id]: true }))}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-50">
                              VVC
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm group-hover:text-[var(--gold-deep)] transition-colors">{productName}</p>
                          {product.item_code && (
                            <p className="mt-1 text-[10px] font-bold text-[var(--gold)] uppercase tracking-wider">
                              {t.itemCode[language]}: {product.item_code}
                            </p>
                          )}
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{product.category?.name || '-'}</td>
                    <td className="px-5 py-4 text-slate-600">{product.brand || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      ${Number(product.price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex w-fit items-center rounded-full border border-slate-200 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleStockChange(product, stock - 1)}
                          disabled={isStockBusy || stock === 0}
                          className="h-8 w-8 rounded-full text-sm font-semibold text-slate-500 hover:bg-slate-50 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                          aria-label={t.decreaseStock[language]}
                        >
                          -
                        </button>
                        <span className="min-w-9 px-1 text-center font-bold text-xs text-slate-800">
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStockChange(product, stock + 1)}
                          disabled={isStockBusy}
                          className="h-8 w-8 rounded-full text-sm font-semibold text-slate-500 hover:bg-slate-50 transition active:scale-95 disabled:opacity-40"
                          aria-label={t.increaseStock[language]}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu 
                        onEdit={() => handleEdit(product)}
                        onDelete={() => handleDelete(product.id)}
                        isDeleting={isDeleting}
                        language={language}
                        t={t}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/30 px-6 py-4 text-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t.page[language]} {currentPageSafe} {t.of[language]} {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPageSafe === 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                {t.prev[language]}
              </button>

              <div className="flex items-center gap-1.5">
                {pageItems.map((item) =>
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-8 w-8 rounded-full text-xs font-bold transition duration-150 ${
                        item === currentPageSafe
                          ? 'bg-[var(--gold)] text-white shadow-sm shadow-[var(--gold)]/30'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="px-1 text-slate-400 text-xs font-bold">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPageSafe === totalPages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                {t.next[language]}
              </button>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-slate-700">{t.noProducts[language]}</p>
            <p className="mt-2 text-xs text-slate-400">{t.noProductsHelp[language]}</p>
            <button onClick={handleAdd} className="mt-6 btn-primary">
              <span aria-hidden="true">+</span>
              {t.addProduct[language]}
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-sm page-fade">
          <div className="bg-[#fffaf0] border border-slate-200/60 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8 shadow-2xl reveal">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200/50 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingId ? t.editTitle[language] : t.addTitle[language]}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{t.formHelp[language]}</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/60 text-slate-500 transition hover:bg-slate-200"
              >
                <span aria-hidden="true" className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.name[language]} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.brand[language]}</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                    placeholder={t.brandPlaceholder[language]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.category[language]}</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                  >
                    <option value="">{t.selectCategory[language]}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.price[language]} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.stock[language]} *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                    required
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.imageUpload[language]}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-[var(--gold)] file:px-3 file:py-1 file:text-[10px] file:font-bold file:uppercase file:text-white focus:border-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-[1fr_2fr] items-start">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Preview</span>
                  <div className="h-32 w-full rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2 shadow-inner overflow-hidden">
                    {imagePreview ? (
                      <BackgroundRemovedImage
                        src={imagePreview}
                        alt={formData.name || 'Preview'}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Image</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.description[language]} *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                    rows="4"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200/50 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
                >
                  {t.cancel[language]}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[var(--gold)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:shadow-md disabled:opacity-60 disabled:pointer-events-none"
                >
                  {saving ? t.saving[language] : t.save[language]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm page-fade">
          <div className="bg-white border border-slate-200/60 w-full max-w-md rounded-2xl p-6 shadow-2xl reveal text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 border border-rose-100 text-rose-600 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.deleteConfirm[language]}</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel[language]}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-rose-700 shadow-sm"
              >
                {t.delete[language]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
