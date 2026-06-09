import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

const getTranslation = (entry, language, fallback) =>
  entry?.[language] ?? entry?.kh ?? entry?.en ?? fallback;

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

const productFooterText = {
  title: {
    kh: 'ផលិតផល',
    en: 'Products',
  },
  links: [
    {
      to: '/products',
      label: {
        kh: 'ផលិតផលទាំងអស់',
        en: 'All products',
      },
    },
    {
      to: '/products?panel=category',
      label: {
        kh: 'ប្រភេទផលិតផល',
        en: 'Product categories',
      },
    },
    {
      to: '/products?stock=in',
      label: {
        kh: 'មានក្នុងស្តុក',
        en: 'In-stock products',
      },
    },
  ],
};

export default function Footer() {
  const { language } = useLanguage();
  const t = translations.footer;
  const currentYear = new Date().getFullYear();
  const footerText = t || {};
  const copyrightText = getTranslation(
    footerText.copyright,
    language,
    '© 2024 VVC. All rights reserved.'
  ).replace(/\b\d{4}\b/, currentYear);

  return (
    <footer className="mt-0 border-t border-[var(--stroke)] bg-white text-[var(--coal)]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="rounded-lg border border-[var(--stroke)] bg-[var(--fog)] p-10 shadow-sm">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold">{getTranslation(footerText.about, language, 'About')}</h3>
              <p className="mt-4 text-sm text-slate-600">
                {getTranslation(footerText.aboutDesc, language, 'VVC curates product stories and helpful product information.')}
              </p>
              <Link to="/about" className="mt-4 inline-flex text-sm font-semibold text-[var(--gold)] hover:text-[var(--gold-deep)]">
                {getTranslation(footerText.learnMore, language, 'Learn more')}
              </Link>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{getTranslation(productFooterText.title, language, 'Products')}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {productFooterText.links.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="hover:text-[var(--gold)]">
                      {getTranslation(item.label, language, 'Products')}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{getTranslation(footerText.support, language, 'Support')}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-[var(--gold)]">{getTranslation(footerText.contact, language, 'Contact')}</a></li>
                <li><a href="#" className="hover:text-[var(--gold)]">{getTranslation(footerText.faq, language, 'FAQ')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{getTranslation(footerText.legal, language, 'Legal')}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li><Link to="/privacy" className="hover:text-[var(--gold)]">{getTranslation(footerText.privacy, language, 'Privacy')}</Link></li>
                <li><Link to="/terms" className="hover:text-[var(--gold)]">{getTranslation(footerText.terms, language, 'Terms')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-[var(--stroke)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">{getTranslation(footerText.socialTitle, language, 'Social media')}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {getTranslation(footerText.socialDesc, language, 'Follow updates and connect with us.')}
              </p>
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
                  {getTranslation(footerText[item.key], language, item.key)}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--stroke)] pt-8 text-center text-sm text-slate-500">
          <p>{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}
