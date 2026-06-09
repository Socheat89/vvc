import React, { useEffect, useRef, useState } from 'react';
import { settingsService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { getSiteLogoUrl } from '../../utils/assetUrls';
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
  DEFAULT_TERMS_CONTENT,
} from '../../constants/siteDefaults';
import fallbackLogo from '../../assets/logo.png';

const defaultForm = {
  website_name: 'Van Van Cambodia',
  logo_name: 'Van Van Cambodia',
  logo: '',
  about_content: DEFAULT_ABOUT_CONTENT,
  privacy_content: DEFAULT_PRIVACY_CONTENT,
  terms_content: DEFAULT_TERMS_CONTENT,
  logoFile: null,
  removeLogo: false,
};

const copy = {
  eyebrow: { kh: 'ការកំណត់វេបសាយ', en: 'Website Settings' },
  title: { kh: 'ការកំណត់វេបសាយ', en: 'Website Settings' },
  subtitle: {
    kh: 'កំណត់ឈ្មោះវេបសាយ ឈ្មោះលើឡូហ្គោ រូបឡូហ្គោ និងខ្លឹមសារទំព័រ About / Privacy / Terms សម្រាប់ frontend។',
    en: 'Control the website name, logo label, logo, and the About / Privacy / Terms page content used across the frontend.',
  },
  websiteName: { kh: 'ឈ្មោះវេបសាយ', en: 'Website name' },
  logoName: { kh: 'ឈ្មោះលើឡូហ្គោ', en: 'Logo name' },
  aboutContent: { kh: 'មាតិកាទំព័រអំពី', en: 'About page content' },
  aboutContentHelp: {
    kh: 'អត្ថបទនេះនឹងបង្ហាញនៅទំព័រ About។ អាចចុះបន្ទាត់ថ្មីដើម្បីបំបែកជា paragraph។',
    en: 'This text appears on the About page. Add line breaks to split it into paragraphs.',
  },
  privacyContent: { kh: 'មាតិកាទំព័រឯកជនភាព', en: 'Privacy policy content' },
  privacyContentHelp: {
    kh: 'អត្ថបទនេះនឹងបង្ហាញនៅទំព័រ Privacy។ អាចចុះបន្ទាត់ទទេដើម្បីបំបែកជា section។',
    en: 'This text appears on the Privacy page. Use blank lines to split it into sections.',
  },
  termsContent: { kh: 'មាតិកាទំព័រលក្ខខណ្ឌ', en: 'Terms of service content' },
  termsContentHelp: {
    kh: 'អត្ថបទនេះនឹងបង្ហាញនៅទំព័រ Terms។ អាចចុះបន្ទាត់ទទេដើម្បីបំបែកជា section។',
    en: 'This text appears on the Terms page. Use blank lines to split it into sections.',
  },
  logoImage: { kh: 'រូបឡូហ្គោ', en: 'Logo image' },
  chooseLogo: { kh: 'ជ្រើសរើសរូបឡូហ្គោ', en: 'Choose logo' },
  changeLogo: { kh: 'ប្តូររូបឡូហ្គោ', en: 'Change logo' },
  removeLogo: { kh: 'ដករូបឡូហ្គោ', en: 'Remove logo' },
  logoHelp: {
    kh: 'គាំទ្រ JPG, PNG, WEBP, GIF, BMP, AVIF; ទំហំអតិបរមា 20MB។',
    en: 'Supports JPG, PNG, WEBP, GIF, BMP, AVIF up to 20MB.',
  },
  preview: { kh: 'Preview', en: 'Preview' },
  save: { kh: 'រក្សាទុក', en: 'Save settings' },
  saving: { kh: 'កំពុងរក្សាទុក...', en: 'Saving...' },
  saved: { kh: 'បានរក្សាទុកការកំណត់រួចហើយ។', en: 'Settings saved.' },
  loadFailed: { kh: 'មិនអាចទាញយក settings បានទេ។', en: 'Unable to load settings.' },
  saveFailed: { kh: 'មិនអាចរក្សាទុក settings បានទេ។', en: 'Unable to save settings.' },
};

const normalizeForm = (settings) => ({
  website_name: settings?.website_name || defaultForm.website_name,
  logo_name: settings?.logo_name || settings?.website_name || defaultForm.logo_name,
  logo: settings?.logo || '',
  about_content: settings?.about_content ?? defaultForm.about_content,
  privacy_content: settings?.privacy_content ?? defaultForm.privacy_content,
  terms_content: settings?.terms_content ?? defaultForm.terms_content,
  logoFile: null,
  removeLogo: false,
});

const getRequestErrorMessage = (error, fallback) => {
  const serverMessage = error?.response?.data?.message;

  if (serverMessage) {
    return `${fallback} ${serverMessage}`;
  }

  if (error?.message) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
};

export default function ManageSettings() {
  const { language } = useLanguage();
  const { applySettings } = useSiteSettings();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(defaultForm);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.get();
      setFormData(normalizeForm(response.data.data));
      setError('');
    } catch (err) {
      setError(getRequestErrorMessage(err, copy.loadFailed[language]));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage('');
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoPreview(URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      logoFile: file,
      removeLogo: false,
    }));
    setMessage('');
  };

  const handleRemoveLogo = () => {
    if (logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoPreview('');
    setFormData((prev) => ({
      ...prev,
      logo: '',
      logoFile: null,
      removeLogo: true,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = new FormData();
      payload.append('website_name', formData.website_name.trim());
      payload.append('logo_name', formData.logo_name.trim());
      payload.append('about_content', formData.about_content.trim());
      payload.append('privacy_content', formData.privacy_content.trim());
      payload.append('terms_content', formData.terms_content.trim());

      if (formData.removeLogo) {
        payload.append('remove_logo', '1');
      }

      if (formData.logoFile) {
        payload.append('logo_file', formData.logoFile, formData.logoFile.name);
      }

      const response = await settingsService.update(payload);
      const nextSettings = response.data.data;

      setFormData(normalizeForm(nextSettings));
      applySettings(nextSettings);
      setLogoPreview('');
      setMessage(copy.saved[language]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(getRequestErrorMessage(err, copy.saveFailed[language]));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const previewLogo = logoPreview || getSiteLogoUrl(formData.logo) || fallbackLogo;
  const previewName = formData.logo_name || formData.website_name || defaultForm.logo_name;

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-10 w-56 animate-pulse rounded bg-slate-200/60" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-96 animate-pulse rounded-2xl glass-card" />
          <div className="h-96 animate-pulse rounded-2xl glass-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-[var(--stroke)]">
        <div>
          <span className="inline-block px-3 py-1 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-deep)] bg-[var(--gold-soft)] shadow-sm rounded-full">
            {copy.eyebrow[language]}
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink)]">
            {copy.title[language]}
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">
            {copy.subtitle[language]}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {copy.websiteName[language]}
            </label>
            <input
              type="text"
              name="website_name"
              value={formData.website_name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {copy.logoName[language]}
            </label>
            <input
              type="text"
              name="logo_name"
              value={formData.logo_name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {copy.aboutContent[language]}
            </label>
            <textarea
              name="about_content"
              value={formData.about_content}
              onChange={handleChange}
              rows={16}
              className="w-full resize-y rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm leading-7 focus:border-[var(--gold)] focus:outline-none transition"
            />
            <p className="mt-2 text-xs text-slate-500">
              {copy.aboutContentHelp[language]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {copy.privacyContent[language]}
            </label>
            <textarea
              name="privacy_content"
              value={formData.privacy_content}
              onChange={handleChange}
              rows={14}
              className="w-full resize-y rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm leading-7 focus:border-[var(--gold)] focus:outline-none transition"
            />
            <p className="mt-2 text-xs text-slate-500">
              {copy.privacyContentHelp[language]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {copy.termsContent[language]}
            </label>
            <textarea
              name="terms_content"
              value={formData.terms_content}
              onChange={handleChange}
              rows={14}
              className="w-full resize-y rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm leading-7 focus:border-[var(--gold)] focus:outline-none transition"
            />
            <p className="mt-2 text-xs text-slate-500">
              {copy.termsContentHelp[language]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {copy.logoImage[language]}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif"
              onChange={handleLogoChange}
              className="hidden"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12 4 4m-4-4-4 4" />
                </svg>
                {formData.logo || logoPreview ? copy.changeLogo[language] : copy.chooseLogo[language]}
              </button>
              {(formData.logo || logoPreview) && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7 5 7m2 0 .867 12.142A2 2 0 009.862 21h4.276a2 2 0 001.995-1.858L17 7M10 11v6m4-6v6M9 7V4h6v3" />
                  </svg>
                  {copy.removeLogo[language]}
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {copy.logoHelp[language]}
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(199,154,45,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(199,154,45,0.6)] disabled:opacity-60"
            >
              {saving ? copy.saving[language] : copy.save[language]}
            </button>
          </div>
        </form>

        <aside className="glass-card rounded-3xl p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {copy.preview[language]}
          </p>
          <div className="mt-6 rounded-2xl border border-[var(--stroke)] bg-white/70 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl border border-white/80 bg-white p-1 shadow-sm">
                <img src={previewLogo} alt={previewName} className="h-11 w-11 object-contain" />
              </span>
              <div className="leading-tight">
                <div className="text-lg font-bold text-[var(--coal)]">{previewName}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {formData.website_name || defaultForm.website_name}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
