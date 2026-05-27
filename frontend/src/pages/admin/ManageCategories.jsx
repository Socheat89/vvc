import React, { useEffect, useMemo, useRef, useState } from 'react';
import { categoryService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

const emptyForm = {
  name: '',
  description: '',
  showcase_image_file: null,
};

const PUBLIC_ASSET_BASE = 'https://app.vvc.asia/vvc_web/vvc/backend/public';
const CATEGORY_UPLOAD_BASE = `${PUBLIC_ASSET_BASE}/uploads/categories`;
const ITEMS_PER_PAGE = 10;
const sortOptions = ['newest', 'nameAsc', 'nameDesc'];
const IMPORTED_CATEGORY_DESCRIPTION = 'Imported from product Excel file';

const categoryShowcaseText = {
  cardImage: {
    kh: 'រូបភាព Product Show',
    en: 'Product Show image',
  },
  cardImageHelp: {
    kh: 'Upload រូប Product Show ដែលអ្នកបាន design សម្រាប់បង្ហាញលើ card ប្រភេទនេះ។',
    en: 'Upload the designed Product Show image for this category card.',
  },
  currentImage: {
    kh: 'រូបបច្ចុប្បន្ន',
    en: 'Current image',
  },
  imageColumn: {
    kh: 'រូប Card',
    en: 'Card image',
  },
};

const extractUploadPath = (value) => {
  const normalizedValue = String(value || '').trim().replace(/\\/g, '/');
  const uploadIndex = normalizedValue.toLowerCase().indexOf('uploads/');
  return uploadIndex >= 0 ? normalizedValue.slice(uploadIndex).replace(/^\/+/, '') : '';
};

const getUploadImageUrl = (image, fallbackBase) => {
  if (!image) return '';
  const rawImage = String(image).trim().replace(/\\/g, '/');
  if (!rawImage) return '';
  if (/^(data:|blob:)/i.test(rawImage)) return rawImage;

  const uploadPath = extractUploadPath(rawImage);
  if (uploadPath) return `${PUBLIC_ASSET_BASE}/${uploadPath}`;
  if (/^https?:\/\//i.test(rawImage)) return rawImage;

  return `${fallbackBase}/${rawImage.replace(/^\/+/, '').replace(/^public\//i, '').replace(/^backend\/public\//i, '')}`;
};

const getCategoryImageUrl = (image) => getUploadImageUrl(image, CATEGORY_UPLOAD_BASE);

const getCategoryDescription = (category) => {
  const description = String(category.description || '').trim();
  return description === IMPORTED_CATEGORY_DESCRIPTION ? '' : description;
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

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImportTip, setShowImportTip] = useState(false);
  const fileInputRef = useRef(null);

  const { language } = useLanguage();
  const t = translations.manageCategories;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const categoryResponse = await categoryService.getAll();
      setCategories(categoryResponse.data.data || []);
      setFormError(null);
    } catch (err) {
      setFormError(t.loadFailed[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return categories
      .filter((category) => {
        if (!term) return true;
        return (
          category.name.toLowerCase().includes(term) ||
          (category.description || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
        if (sortBy === 'nameDesc') return b.name.localeCompare(a.name);
        return Number(b.id) - Number(a.id);
      });
  }, [categories, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
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

  const paginatedCategories = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPageSafe, filteredCategories]);

  const editingCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(editingId)),
    [categories, editingId]
  );

  const currentCategoryImage = getCategoryImageUrl(editingCategory?.showcase_image);
  const formPreviewImage = imagePreview || currentCategoryImage;

  const stats = useMemo(() => {
    return {
      totalCategories: categories.length,
    };
  }, [categories.length]);

  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setImagePreview('');
    setFormError(null);
    setImportResult(null);
    setShowForm(true);
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name || '',
      description: getCategoryDescription(category),
      showcase_image_file: null,
    });
    setImagePreview('');
    setFormError(null);
    setShowForm(true);
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
      const response = await categoryService.import(file);
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

  const handleShowcaseImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    setFormData((current) => ({
      ...current,
      showcase_image_file: file,
    }));

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview('');
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError(null);
      const basePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      };
      let payload = basePayload;

      if (formData.showcase_image_file) {
        payload = new FormData();
        payload.append('name', basePayload.name);
        payload.append('description', basePayload.description || '');
        payload.append('showcase_image_file', formData.showcase_image_file);
      }

      if (editingId) {
        await categoryService.update(editingId, payload);
      } else {
        await categoryService.create(payload);
      }

      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      setImagePreview('');
    } catch (err) {
      setFormError(err.response?.data?.message || t.saveFailed[language]);
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
      await categoryService.delete(deleteConfirmId);
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setImagePreview('');
    setFormError(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-56 rounded bg-slate-200/60" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
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
            disabled={importing}
            className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {importing ? t.importing[language] : t.importExcel[language]}
          </button>
          <button 
            onClick={handleAdd} 
            className="flex items-center gap-2 rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(199,154,45,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(199,154,45,0.6)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="text-sm font-light">+</span>
            {t.addCategory[language]}
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
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 reveal">
        <div className="glass-card rounded-2xl p-5 transition hover:shadow-md bg-white/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.totalCategories[language]}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-800">{stats.totalCategories}</p>
        </div>
      </div>

      {/* Control Bar (Filters & Search) */}
      <div className="glass-card rounded-2xl p-4 bg-white/80 border border-slate-100/60 shadow-sm reveal reveal-delay-1">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t.searchPlaceholder[language]}
              className="w-full rounded-xl border border-slate-200 bg-white/80 pl-10 pr-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
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

      {/* Main Categories Card */}
      <div className="glass-card overflow-hidden rounded-2xl bg-white/80 border border-slate-100/60 shadow-sm reveal reveal-delay-2">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">{t.listTitle[language]}</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {filteredCategories.length} {t.results[language]}
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
          <table className="w-full min-w-[720px] text-sm text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{categoryShowcaseText.imageColumn[language]}</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{t.name[language]}</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{t.description[language]}</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">{t.actions[language]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCategories.map((category) => {
                const isDeleting = deletingId === category.id;
                const previewImage = getCategoryImageUrl(category.showcase_image);
                const description = getCategoryDescription(category);

                return (
                  <tr key={category.id} className="transition hover:bg-slate-50/30 group">
                    <td className="px-6 py-4">
                      <div className="grid h-16 w-24 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm group-hover:scale-[1.03] transition duration-200">
                        {previewImage ? (
                          <img src={previewImage} alt="" className="h-full w-full object-contain p-2" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 flex items-center justify-center h-full w-full">VVC</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 text-sm group-hover:text-[var(--gold-deep)] transition-colors">{category.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs leading-relaxed max-w-sm truncate">
                      {description || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu 
                        onEdit={() => handleEdit(category)}
                        onDelete={() => handleDelete(category.id)}
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
        {filteredCategories.length > 0 && totalPages > 1 && (
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

        {filteredCategories.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-slate-700">{t.noCategories[language]}</p>
            <p className="mt-2 text-xs text-slate-400">{t.noCategoriesHelp[language]}</p>
            <button onClick={handleAdd} className="mt-6 btn-primary">
              <span aria-hidden="true">+</span>
              {t.addCategory[language]}
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-sm page-fade">
          <div className="bg-[#fffaf0] border border-slate-200/60 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8 shadow-2xl reveal">
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
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.name[language]} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.description[language]}</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                  rows="4"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-[180px_1fr] items-start rounded-2xl border border-slate-200/80 bg-white/50 p-5 shadow-inner">
                <div className="space-y-2 mx-auto sm:mx-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Showcase Preview</span>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 h-36 w-40 flex items-center justify-center p-2 shadow-sm">
                    {formPreviewImage ? (
                      <img
                        src={formPreviewImage}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        VVC SHOW
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 w-full">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    {categoryShowcaseText.cardImage[language]}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleShowcaseImageChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-[var(--gold-soft)] file:px-4 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:text-[var(--gold-deep)] focus:border-[var(--gold)]"
                  />
                  <p className="text-[10px] leading-relaxed text-slate-400 mt-2">
                    {categoryShowcaseText.cardImageHelp[language]}
                  </p>
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
              Are you sure you want to permanently delete this category? This action cannot be undone.
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
