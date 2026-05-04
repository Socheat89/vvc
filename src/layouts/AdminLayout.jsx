import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxOpen,
  faChartColumn,
  faChevronLeft,
  faChevronRight,
  faGlobe,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { language, toggleLanguage } = useLanguage();
  const t = translations.adminLayout;
  const tc = translations.common;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-[var(--fog)]">
      <div className={`bg-[var(--coal)] text-white transition-all ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          {isSidebarOpen && <h1 className="text-lg font-semibold">{t.title[language]}</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white/80">
            <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faChevronRight} className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-8 space-y-2 px-3">
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/80 hover:bg-white/10"
          >
            <FontAwesomeIcon icon={faChartColumn} className="h-4 w-4" />
            {isSidebarOpen && <span>{t.dashboard[language]}</span>}
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/80 hover:bg-white/10"
          >
            <FontAwesomeIcon icon={faBoxOpen} className="h-4 w-4" />
            {isSidebarOpen && <span>{t.products[language]}</span>}
          </Link>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/60 bg-white/80 px-8 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{t.panelLabel[language]}</p>
            <h2 className="text-2xl font-semibold text-slate-800">{t.operationsStudio[language]}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.name}</span>

            <button
              onClick={toggleLanguage}
              title={language === 'kh' ? 'Switch to English' : 'Switch to Khmer'}
              className="flex items-center gap-1.5 rounded-full border border-[var(--ember)]/40 bg-[var(--ember)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--ember)] transition hover:bg-[var(--ember)]/15"
            >
              <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
              {tc.languageToggle[language]}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
              {t.logout[language]}
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
