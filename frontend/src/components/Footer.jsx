import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

const socialLinks = [
  {
    key: 'telegram',
    href: 'https://t.me/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.7 4.5 3.8 11c-1.1.4-1.1 1 0 1.4l4.2 1.3 1.6 5c.2.7.5.9 1 .9.4 0 .7-.2 1-.5l2.3-2.2 4.6 3.4c.9.5 1.5.3 1.7-.8l3-14c.3-1.2-.4-1.7-1.5-1.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m8.2 13.5 8.8-5.6-6.8 7.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'facebook',
    href: 'https://www.facebook.com/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 8.6h2.4V5.2c-.4-.1-1.7-.2-3.2-.2-3.2 0-5.3 1.9-5.3 5.5v3.1H4.5v3.8h3.4V23h4.1v-5.6h3.4l.6-3.8h-4v-2.7c0-1.1.3-2.3 2-2.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
];

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
              <Link to="/about" className="mt-4 inline-flex text-sm font-semibold text-[var(--gold)] hover:text-[var(--gold-deep)]">
                {t.learnMore[language]}
              </Link>
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

          <div className="mt-8 flex flex-col gap-4 border-t border-[var(--stroke)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">{t.socialTitle[language]}</h3>
              <p className="mt-2 text-sm text-slate-600">{t.socialDesc[language]}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--stroke)] bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold)] hover:text-[var(--gold-deep)]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gold-soft)] text-[var(--gold-deep)]">
                    {item.icon}
                  </span>
                  {t[item.key][language]}
                </a>
              ))}
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
