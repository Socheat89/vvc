import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

export default function Header() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = translations;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--stroke)] bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white p-1 shadow-sm">
            <img src={logo} alt="Van Van Cambodia" className="h-8 w-8 object-contain" />
          </span>
          <div className="leading-tight">
            <div className="text-lg font-semibold text-[var(--coal)]">Van Van Cambodia</div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {t.header.subtitle[language]}
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 p-2 text-sm font-semibold text-slate-600 shadow-sm md:flex">
          <button
            onClick={() => navigate('/')}
            className="rounded-full px-4 py-2 transition hover:bg-slate-900 hover:text-white"
          >
            {t.header.home[language]}
          </button>
          <button
            onClick={() => navigate('/products')}
            className="rounded-full px-4 py-2 transition hover:bg-slate-900 hover:text-white"
          >
            {t.header.products[language]}
          </button>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={language === 'kh' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
            className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[var(--ink)]"
          >
            {/* Globe Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {t.common.languageToggle[language]}
          </button>
        </div>

        {/* Mobile: Explore + Language */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[var(--ink)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {t.common.languageToggle[language]}
          </button>
          <Link to="/products" className="btn-primary text-sm">
            {t.header.explore[language]}
          </Link>
        </div>
      </nav>
    </header>
  );
}
