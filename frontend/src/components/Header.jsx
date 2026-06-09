import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import translations from '../translations';

const getTranslation = (entry, language, fallback) =>
  entry?.[language] ?? entry?.kh ?? entry?.en ?? fallback;

export default function Header() {
  const { language, toggleLanguage } = useLanguage();
  const { displayName, logoUrl } = useSiteSettings();
  const t = translations;
  const headerText = t.header || {};
  const commonText = t.common || {};
  const brandLogo = logoUrl || logo;
  const brandName = displayName || 'Van Van Cambodia';
  const desktopNavItems = [
    { to: '/', label: getTranslation(headerText.home, language, 'Home'), end: true },
    { to: '/products', label: getTranslation(headerText.products, language, 'Products') },
    { to: '/about', label: getTranslation(headerText.about, language, 'About') },
  ];
  const mobileNavItems = [
    {
      to: '/',
      label: getTranslation(headerText.home, language, 'Home'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10.8 12 4l8 6.8V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      to: '/products',
      label: getTranslation(headerText.products, language, 'Products'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5v-9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="m5 7.5 7 3.5 7-3.5M12 11v9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      to: '/about',
      label: getTranslation(headerText.about, language, 'About'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 17v-6M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <header className={`public-header sticky top-0 z-40 border-b border-[var(--stroke)] bg-white/85 backdrop-blur ${language === 'kh' ? 'public-header-kh' : ''}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-white/80 bg-white p-1 shadow-sm">
            <img src={brandLogo} alt={brandName} className="h-14 w-14 object-contain" />
          </span>
          <div className="leading-tight">
            <div className="text-lg font-semibold text-[var(--coal)]">{brandName}</div>
          </div>
        </Link>

        <div className="public-nav-menu hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 p-2 text-sm font-semibold text-slate-600 shadow-sm md:flex">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={language === 'kh' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
            className="public-language-toggle flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[var(--ink)]"
          >
            {/* Globe Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {getTranslation(commonText.languageToggle, language, language === 'kh' ? 'EN' : 'ខ្មែរ')}
          </button>
        </div>

        {/* Mobile: Explore + Language */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleLanguage}
            className="public-mobile-action flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[var(--ink)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {getTranslation(commonText.languageToggle, language, language === 'kh' ? 'EN' : 'ខ្មែរ')}
          </button>
          <Link to="/products" className="public-mobile-action btn-primary text-sm">
            {getTranslation(headerText.explore, language, 'Explore')}
          </Link>
        </div>
      </nav>
    </header>

      <nav className="mobile-app-tabs" aria-label="Mobile navigation">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `mobile-app-tab ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
