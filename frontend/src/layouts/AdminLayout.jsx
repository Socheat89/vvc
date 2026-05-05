import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const { language, toggleLanguage } = useLanguage();
  const t = translations.adminLayout;
  const tc = translations.common;

  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const productsDropdownRef = useRef(null);
  const settingsDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target)) {
        setIsProductsOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? 'bg-[var(--ink)] text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-[var(--ink)]'
    }`;

  return (
    <div className="min-h-screen mesh-bg">
      <header className="sticky top-0 z-30 border-b border-[var(--stroke)] bg-white/70 text-[var(--ink)] shadow-sm backdrop-blur-md">
        <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{t.panelLabel[language]}</p>
            <h1 className="mt-1 text-xl font-semibold">{t.title[language]}</h1>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Admin navigation">
            <NavLink to="/admin" end className={navLinkClass}>
              {t.dashboard[language]}
            </NavLink>
            <div className="relative" ref={productsDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProductsOpen(!isProductsOpen)}
                className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isProductsOpen ? 'bg-slate-100 text-[var(--ink)]' : 'text-slate-600 hover:bg-slate-100 hover:text-[var(--ink)]'
                }`}
              >
                {t.products[language]}
                <svg className={`h-4 w-4 transition-transform ${isProductsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isProductsOpen && (
                <div className="absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 rounded-2xl border border-slate-200/60 bg-white/95 p-2 shadow-xl backdrop-blur-md reveal z-50">
                  <NavLink to="/admin/products" end className={(props) => `${navLinkClass(props)} block w-full text-center`} onClick={() => setIsProductsOpen(false)}>
                    {t.products[language]}
                  </NavLink>
                  <NavLink to="/admin/categories" className={(props) => `${navLinkClass(props)} block w-full text-center mt-1`} onClick={() => setIsProductsOpen(false)}>
                    {t.categories[language]}
                  </NavLink>
                </div>
              )}
            </div>

            <div className="relative" ref={settingsDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isSettingsOpen ? 'bg-slate-100 text-[var(--ink)]' : 'text-slate-600 hover:bg-slate-100 hover:text-[var(--ink)]'
                }`}
              >
                {t.settings[language]}
                <svg className={`h-4 w-4 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isSettingsOpen && (
                <div className="absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 rounded-2xl border border-slate-200/60 bg-white/95 p-2 shadow-xl backdrop-blur-md reveal z-50">
                  <NavLink to="/admin/users" className={(props) => `${navLinkClass(props)} block w-full text-center`} onClick={() => setIsSettingsOpen(false)}>
                    {t.users[language]}
                  </NavLink>
                  <NavLink to="/admin/translations" className={(props) => `${navLinkClass(props)} block w-full text-center mt-1`} onClick={() => setIsSettingsOpen(false)}>
                    {t.translations[language]}
                  </NavLink>
                </div>
              )}
            </div>
          </nav>

          <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
            {user.name && <span className="text-sm text-slate-500">{user.name}</span>}
            <button
              onClick={toggleLanguage}
              title={language === 'kh' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
              className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[var(--ink)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {tc.languageToggle[language]}
            </button>

            <button
              onClick={handleLogout}
              className="rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100"
            >
              {t.logout[language]}
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
