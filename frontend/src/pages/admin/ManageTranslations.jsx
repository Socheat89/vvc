import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

export default function ManageTranslations() {
  const { language } = useLanguage();
  const t = translations.manageTranslations || { 
    title: { kh: 'គ្រប់គ្រងភាសា', en: 'Manage Translations' },
    subtitle: { kh: 'កែប្រែនិងបន្ថែមភាសាបកប្រែនៅក្នុងប្រព័ន្ធ។', en: 'Edit and add system translations.' },
    comingSoon: { kh: 'មុខងារនេះនឹងមានឆាប់ៗនេះ', en: 'This feature is coming soon' }
  };

  return (
    <div className="space-y-6 page-fade">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="pill">Localization</span>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t.title[language]}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{t.subtitle[language]}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl reveal transition-all duration-300 hover:shadow-lg">
        <div className="px-6 py-12 text-center">
          <p className="font-semibold text-slate-800">{t.comingSoon[language]}</p>
          <p className="mt-2 text-sm text-slate-500">The translation management system will be placed here.</p>
        </div>
      </div>
    </div>
  );
}
