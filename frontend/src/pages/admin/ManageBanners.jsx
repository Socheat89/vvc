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

const PUBLIC_ASSET_BASE = 'https://vvc.asia/backend/public';
const BANNER_UPLOAD_BASE = `${PUBLIC_ASSET_BASE}/uploads/banners`;

const getBannerImageUrl = (image) => {
  if (!image) return '';
  const rawImage = String(image).trim().replace(/\\/g, '/');
  if (!rawImage) return '';
  if (/^(data:|blob:)/i.test(rawImage)) return rawImage;

  const uploadIndex = rawImage.toLowerCase().indexOf('uploads/');
  if (uploadIndex >= 0) {
    return `${PUBLIC_ASSET_BASE}/${rawImage.slice(uploadIndex).replace(/^\/+/, '')}`;
  }

  if (/^https?:\/\//i.test(rawImage)) {
    return rawImage;
  }

  const imagePath = rawImage
    .replace(/^\/+/, '')
    .replace(/^public\//i, '')
    .replace(/^backend\/public\//i, '');

  return `${BANNER_UPLOAD_BASE}/${imagePath}`;
};

const toneOptions = [
  { value: 'gold', label: { kh: 'ពណ៌មាស', en: 'Gold' } },
  { value: 'paper', label: { kh: 'ពណ៌ក្រដាស', en: 'Paper' } },
  { value: 'ink', label: { kh: 'ពណ៌墨', en: 'Ink' } },
];

const getApiErrorMessage = (error, fallback) => {
  const data = error.response?.data;

  if (data?.errors && typeof data.errors === 'object') {
    const firstError = Object.values(data.errors).flat().find(Boolean);
    if (firstError) return firstError;
  }

  if (data?.message && data.message !== 'Server Error') {
    return data.message;
  }

  if (error.response?.status === 500) {
    return 'Server Error: banner image upload/update failed on the backend. Please deploy the BannerController fix and check uploads/banners permissions.';
  }

  return data?.message || error.message || fallback;
};

const convertImageFileToWebp = (file) => new Promise((resolve) => {
  if (!file?.type?.startsWith('image/') || file.type === 'image/webp') {
    resolve(file);
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const context = canvas.getContext('2d');
    if (!context || !canvas.width || !canvas.height) {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
      return;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(objectUrl);

      if (!blob || blob.size <= 0) {
        resolve(file);
        return;
      }

      const webpName = file.name.replace(/\.[^.]+$/, '') || 'banner';
      resolve(new File([blob], `${webpName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      }));
    }, 'image/webp', 0.86);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(file);
  };

  image.src = objectUrl;
});

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

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadFile = await convertImageFileToWebp(file);

      setFormData((prev) => ({
        ...prev,
        imageFile: uploadFile,
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(uploadFile);
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
      setFormError(getApiErrorMessage(err, t.saveFailed[language]));
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
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-56 rounded bg-slate-200/60" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div>
          <span className="inline-block px-3 py-1 mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-deep)] bg-[var(--gold-soft)] shadow-sm rounded-full">
            {t.eyebrow[language]}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t.title[language]}</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">{t.subtitle[language]}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(199,154,45,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(199,154,45,0.6)] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
        >
          <span className="text-sm font-light">+</span>
          {t.addBanner[language]}
        </button>
      </div>

      {/* Notification banner */}
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2 items-center">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm page-fade">
          <div className="bg-[#fffaf0] border border-slate-200/60 rounded-2xl w-full max-w-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl reveal">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200/50 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? t.editBanner[language] : t.addNewBanner[language]}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.title[language]}</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t.titlePlaceholder[language]}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.tone[language]}</label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">{t.image[language]}</label>
                <div className="flex gap-4 items-center">
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
                      className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
                    >
                      {imagePreview ? t.changeImage[language] : t.chooseImage[language]}
                    </button>
                  </div>
                  
                  {imagePreview && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex-shrink-0 group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, imageFile: null }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">{t.imageHelp[language]}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200/50 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
                >
                  {t.cancel[language]}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg transition hover:shadow-xl disabled:opacity-60 disabled:pointer-events-none"
                >
                  {saving ? t.saving[language] : (editingId ? t.update[language] : t.create[language])}
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
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">{t.deleteConfirmDesc[language]}</p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel[language]}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deletingId === deleteConfirmId}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-rose-700 shadow-sm"
              >
                {deletingId === deleteConfirmId ? t.deleting[language] : t.delete[language]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banners List */}
      {banners.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center shadow-inner">
          <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p className="text-sm font-semibold text-slate-600">{t.noBanners[language]}</p>
          <p className="mt-2 text-xs text-slate-400">{t.noBannersDesc[language]}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => {
            const toneValue = banner.tone;
            let toneTagClass = 'bg-slate-50 text-slate-600 border-slate-200';
            if (toneValue === 'gold') toneTagClass = 'bg-[var(--gold-soft)] text-[var(--gold-deep)] border-[var(--gold)]/20';
            else if (toneValue === 'paper') toneTagClass = 'bg-[#fcf9f2] text-slate-700 border-slate-200';
            else if (toneValue === 'ink') toneTagClass = 'bg-slate-900 text-slate-100 border-slate-950';

            return (
              <div
                key={banner.id}
                className="glass-card rounded-2xl p-5 flex items-center gap-5 group hover:shadow-md transition bg-white/70"
              >
                {banner.image && (
                  <div className="h-16 w-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100 shadow-sm group-hover:scale-[1.02] transition duration-200">
                    <img src={getBannerImageUrl(banner.image)} alt={banner.title} className="h-full w-full object-cover" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{banner.title || t.untitled[language]}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${toneTagClass}`}>
                      {toneOptions.find(t => t.value === banner.tone)?.label[language]}
                    </span>
                    <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      banner.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200/60'
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
            );
          })}
        </div>
      )}
    </div>
  );
}
