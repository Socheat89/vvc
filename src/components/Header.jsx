import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

export default function Header() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = translations;

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Van Van Cambodia" className="h-10 w-10 rounded-full object-contain" />
          <div className="leading-tight">
            <div className="text-xl font-semibold text-[var(--coal)]">Van Van Cambodia</div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {t.header.subtitle[language]}
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <button onClick={() => navigate('/')} className="transition hover:text-[var(--ember)]">
            {t.header.home[language]}
          </button>
          <button onClick={() => navigate('/products')} className="transition hover:text-[var(--ember)]">
            {t.header.products[language]}
          </button>

          <button
            onClick={toggleLanguage}
            title={language === 'kh' ? 'Switch to English' : 'Switch to Khmer'}
            className="flex items-center gap-1.5 rounded-full border border-[var(--ember)]/40 bg-[var(--ember)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--ember)] transition hover:bg-[var(--ember)]/15"
          >
            <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
            {t.common.languageToggle[language]}
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleLanguage}
            title={language === 'kh' ? 'Switch to English' : 'Switch to Khmer'}
            className="flex items-center gap-1 rounded-full border border-[var(--ember)]/40 bg-[var(--ember)]/5 px-2.5 py-1 text-xs font-semibold text-[var(--ember)] transition hover:bg-[var(--ember)]/15"
          >
            <FontAwesomeIcon icon={faGlobe} className="h-3.5 w-3.5" />
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
