import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useNavigation, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

// Loading Component
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-t-2 border-[var(--gold)] animate-spin"></div>
      <div className="absolute inset-2 rounded-full border-r-2 border-[var(--gold-deep)] animate-spin-reverse"></div>
      <div className="absolute inset-4 rounded-full border-b-2 border-slate-300 animate-spin"></div>
    </div>
    <div className="mt-4 text-sm font-semibold tracking-widest text-[#B8860B] animate-pulse">
      LOADING...
    </div>
  </div>
);

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const { language, toggleLanguage } = useLanguage();
  const t = translations.adminLayout;
  const tc = translations.common;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [apiRequestsCount, setApiRequestsCount] = useState(0);
  const location = useLocation();

  // Handle API fetching state
  useEffect(() => {
    const handleRequestStart = () => setApiRequestsCount((prev) => prev + 1);
    const handleRequestEnd = () => setApiRequestsCount((prev) => Math.max(0, prev - 1));

    window.addEventListener('api-request-start', handleRequestStart);
    window.addEventListener('api-request-end', handleRequestEnd);

    return () => {
      window.removeEventListener('api-request-start', handleRequestStart);
      window.removeEventListener('api-request-end', handleRequestEnd);
    };
  }, []);

  // Handle page transitions loading state
  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 400); // Small delay to show animation

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isLoading = isPageLoading || apiRequestsCount > 0;

  // Close sidebar on screen size change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-[var(--gold)] text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-[var(--ink)]'
    }`;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-[#fffaf0] text-[var(--ink)] font-sans mesh-bg">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[var(--ink)]/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col glass-card border-r border-[var(--stroke)] shadow-sm transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--stroke)] bg-white/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ink)] text-[var(--gold)] font-bold shadow-md">
              V
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[var(--ink)]">{t.title[language] || 'VVC Admin'}</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{t.panelLabel[language]}</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-500 hover:text-[var(--ink)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
          <nav className="space-y-1.5" aria-label="Admin navigation">
            <NavLink to="/admin" end className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              {t.dashboard[language]}
            </NavLink>

            {/* Catalog Group */}
            <div className="pt-5 pb-2">
              <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Catalog</p>
              
              <NavLink to="/admin/products" className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                {t.products[language]}
              </NavLink>
              
              <NavLink to="/admin/categories" className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                {t.categories[language]}
              </NavLink>

              <NavLink to="/admin/banners" className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {t.banners[language]}
              </NavLink>
            </div>

            {/* Settings Group */}
            <div className="pt-5 pb-2">
              <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">System</p>
              
              <NavLink to="/admin/users" className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                {t.users[language]}
              </NavLink>
              
              <NavLink to="/admin/translations" className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                {t.translations[language]}
              </NavLink>
            </div>
          </nav>
        </div>

        <div className="border-t border-[var(--stroke)] p-4 bg-white/40">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-[var(--gold-soft)] border border-[var(--gold)] flex items-center justify-center font-bold text-[var(--gold-deep)] shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--ink)]">{user.name || 'Admin'}</span>
              <span className="text-xs text-slate-500 truncate w-36">{user.email || 'admin@example.com'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-[var(--stroke)] py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-red-600 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t.logout[language]}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-white/70 backdrop-blur-md border-b border-[var(--stroke)] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 transition-shadow">
          <button 
            type="button" 
            onClick={toggleSidebar} 
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          <div className="flex items-center ml-auto gap-4">
            <button
              onClick={toggleLanguage}
              title={language === 'kh' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
              className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-white px-4 py-1.5 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <svg className="w-4 h-4 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              {tc.languageToggle[language]}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto relative">
          {apiRequestsCount > 0 && !isPageLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm fade-in">
              <div className="flex flex-col items-center">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[var(--gold)] animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-[var(--gold-deep)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-4 rounded-full border-b-2 border-slate-300 animate-spin" style={{ animationDuration: '2s' }}></div>
                </div>
                <div className="mt-4 text-xs font-bold tracking-[0.3em] text-[var(--gold)] animate-pulse uppercase">
                  Loading
                </div>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            {isPageLoading ? (
              <div className="flex h-full min-h-[50vh] items-center justify-center fade-in">
                <div className="flex flex-col items-center">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-[var(--gold)] animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-[var(--gold-deep)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <div className="absolute inset-4 rounded-full border-b-2 border-slate-300 animate-spin" style={{ animationDuration: '2s' }}></div>
                  </div>
                  <div className="mt-4 text-xs font-bold tracking-[0.3em] text-[var(--gold)] animate-pulse uppercase">
                    Loading
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <Outlet />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
