import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

export default function Footer() {
  const { language } = useLanguage();
  const t = translations.footer;

  return (
    <footer className="mt-20 border-t border-[var(--stroke)] bg-white text-[var(--coal)]">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-lg border border-[var(--stroke)] bg-[var(--fog)] p-10 shadow-sm">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold">{t.about[language]}</h3>
              <p className="mt-4 text-sm text-slate-600">{t.aboutDesc[language]}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t.collections[language]}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-[var(--gold)]">{t.electronics[language]}</a></li>
                <li><a href="#" className="hover:text-[var(--gold)]">{t.clothing[language]}</a></li>
                <li><a href="#" className="hover:text-[var(--gold)]">{t.books[language]}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t.support[language]}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-[var(--gold)]">{t.contact[language]}</a></li>
                <li><a href="#" className="hover:text-[var(--gold)]">{t.faq[language]}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t.legal[language]}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-[var(--gold)]">{t.privacy[language]}</a></li>
                <li><a href="#" className="hover:text-[var(--gold)]">{t.terms[language]}</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--stroke)] pt-8 text-center text-sm text-slate-500">
          <p>{t.copyright[language]}</p>
        </div>
      </div>
    </footer>
  );
}
