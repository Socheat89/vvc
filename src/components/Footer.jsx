import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

export default function Footer() {
  const { language } = useLanguage();
  const t = translations.footer;

  return (
    <footer className="mt-20 bg-[var(--coal)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold">{t.about[language]}</h3>
            <p className="mt-4 text-sm text-slate-300">{t.aboutDesc[language]}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t.collections[language]}</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white">{t.electronics[language]}</a></li>
              <li><a href="#" className="hover:text-white">{t.clothing[language]}</a></li>
              <li><a href="#" className="hover:text-white">{t.books[language]}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t.support[language]}</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white">{t.contact[language]}</a></li>
              <li><a href="#" className="hover:text-white">{t.faq[language]}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t.legal[language]}</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white">{t.privacy[language]}</a></li>
              <li><a href="#" className="hover:text-white">{t.terms[language]}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-slate-400">
          <p>{t.copyright[language]}</p>
        </div>
      </div>
    </footer>
  );
}
