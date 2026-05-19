import React, { useEffect, useRef, useState } from 'react';
import { bannerService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

const emptyForm = {
  title: '',
  tone: 'gold',
  image: '',
  imageFile: null,
};

const toneOptions = [
  { value: 'gold', label: { kh: 'ពណ៌មាស', en: 'Gold' } },
  { value: 'paper', label: { kh: 'ពណ៌ក្រដាស', en: 'Paper' } },
  { value: 'ink', label: { kh: 'ពណ៌墨', en: 'Ink' } },
];

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
              className="flex w-full items-center px-4 py-2.5 text-sm text-[var(--teal)] hover:bg-teal-50 font-semibold transition-colors"
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

export default function ManageBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const { language } = useLanguage();
  const t = translations.manageBanners;

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await bannerService.adminGetAll();
      setBanners(response.data.data || []);
      setFormError(null);
    } catch (err) {
      setFormError(t.loadFailed[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const buildPayload = (data) => {
    const payload = {
      title: data.title.trim() || null,
      tone: data.tone,
    };

    if (!data.imageFile) {
      return payload;
    }

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value === null ? '' : value);
      }
    });

    formData.append('image_file', data.imageFile, data.imageFile.name);

    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tone) {
      setFormError(t.toneRequired[language]);
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const payload = buildPayload(formData);

      if (editingId) {
        await bannerService.update(editingId, payload);
      } else {
        await bannerService.create(payload);
      }

      await fetchBanners();
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || t.saveFailed[language]);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title || '',
      tone: banner.tone,
      image: banner.image || '',
      imageFile: null,
    });
    setImagePreview(null);
    setShowForm(true);
    setFormError(null);
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await bannerService.delete(id);
      await fetchBanners();
      setDeleteConfirmId(null);
    } catch (err) {
      setFormError(err.response?.data?.message || t.deleteFailed[language]);
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setImagePreview(null);
    setFormError(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded bg-slate-200/60" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl glass-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-[var(--stroke)]">
        <div>
          <span className="inline-block px-3 py-1 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-deep)] bg-[var(--gold-soft)] shadow-sm rounded-full">
            {t.eyebrow[language]}
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink)]">{t.title[language]}</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">{t.subtitle[language]}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-sm font-semibold shadow-[0_4px_14px_rgba(199,154,45,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(199,154,45,0.6)] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          {t.addBanner[language]}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                {editingId ? t.editBanner[language] : t.addNewBanner[language]}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.title[language]}</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t.titlePlaceholder[language]}
                  className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.tone[language]}</label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none transition"
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.image[language]}</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
                    >
                      {imagePreview ? t.changeImage[language] : t.chooseImage[language]}
                    </button>
                  </div>
                  {imagePreview && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, imageFile: null }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">{t.imageHelp[language]}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-full border border-[var(--stroke)] bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {t.cancel[language]}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-sm font-semibold shadow-lg transition hover:shadow-xl disabled:opacity-60"
                >
                  {saving ? t.saving[language] : (editingId ? t.update[language] : t.create[language])}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card rounded-3xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">{t.deleteConfirm[language]}</h3>
            <p className="text-sm text-slate-600 mb-6">{t.deleteConfirmDesc[language]}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-full border border-[var(--stroke)] bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel[language]}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deletingId === deleteConfirmId}
                className="flex-1 rounded-full bg-red-600 text-white px-4 py-2.5 text-sm font-semibold transition hover:bg-red-700 disabled:opacity-60"
              >
                {deletingId === deleteConfirmId ? t.deleting[language] : t.delete[language]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banners List */}
      {banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <p className="text-sm font-semibold text-slate-600">{t.noBanners[language]}</p>
          <p className="mt-1 text-xs text-slate-500">{t.noBannersDesc[language]}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="glass-card rounded-2xl p-5 flex items-center gap-4 group hover:shadow-md transition"
            >
              {banner.image && (
                <div className="h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                  <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--ink)] truncate">{banner.title || t.untitled[language]}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {toneOptions.find(t => t.value === banner.tone)?.label[language]}
                  </span>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                    banner.active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {banner.active ? t.active[language] : t.inactive[language]}
                  </span>
                </div>
              </div>
              <ActionMenu
                onEdit={() => handleEdit(banner)}
                onDelete={() => setDeleteConfirmId(banner.id)}
                isDeleting={deletingId === banner.id}
                language={language}
                t={t}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
