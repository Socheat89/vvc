import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import translations from '../translations';

// Loading Component (Premium Concentric Spinner)
const PageLoader = ({ language }) => (
  <div className="flex flex-col items-center justify-center p-16">
    <div className="relative w-16 h-16 mb-6">
      {/* Concentric rotating rings */}
      <div className="absolute inset-0 rounded-full border-2 border-t-[var(--gold)] border-r-[var(--gold)] animate-spin" style={{ animationDuration: '1s' }}></div>
      <div className="absolute inset-1.5 rounded-full border-2 border-b-[var(--gold-deep)] border-l-[var(--gold-deep)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}></div>
      <div className="absolute inset-3 rounded-full border-2 border-t-slate-300 border-l-slate-300 animate-spin" style={{ animationDuration: '2s' }}></div>
    </div>
    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gold-deep)] animate-pulse" style={{ animationDuration: '2s' }}>
      {language === 'kh' ? 'កំពុងផ្ទុកស្ទូឌីយ៉ូ...' : 'LOADING STUDIO...'}
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
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    }, 450); // Small delay to show animations cleanly

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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Dynamic Breadcrumbs helper
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const crumbs = [];

    if (paths.length === 1 && paths[0] === 'admin') {
      crumbs.push({ label: t.dashboard[language], link: '/admin' });
    } else if (paths.length > 1 && paths[0] === 'admin') {
      const subpage = paths[1];
      
      // Category classification
      if (['products', 'categories', 'banners'].includes(subpage)) {
        crumbs.push({ label: language === 'kh' ? 'កាតាឡុក' : 'Catalog', link: '#' });
      } else if (['users', 'translations'].includes(subpage)) {
        crumbs.push({ label: language === 'kh' ? 'ប្រព័ន្ធ' : 'System', link: '#' });
      }

      // Exact title mapping
      let exactLabel = '';
      if (subpage === 'products') exactLabel = t.products[language];
      else if (subpage === 'categories') exactLabel = t.categories[language];
      else if (subpage === 'banners') exactLabel = t.banners[language];
      else if (subpage === 'users') exactLabel = t.users[language];
      else if (subpage === 'translations') exactLabel = t.translations[language];

      crumbs.push({ label: exactLabel || subpage, link: `/admin/${subpage}` });
    }

    return crumbs;
  };

  return (
    <div className="flex min-h-screen bg-[#fffaf0] text-[var(--ink)] font-sans relative">
      
      {/* Custom styles injection for top progress loading bar & micro-animations */}
      <style>{`
        @keyframes topProgress {
          0% { transform: scaleX(0); transform-origin: left; }
          40% { transform: scaleX(0.65); transform-origin: left; }
          80% { transform: scaleX(0.85); transform-origin: left; }
          100% { transform: scaleX(1); transform-origin: right; }
        }
        .animate-top-progress {
          animation: topProgress 1.6s infinite ease-in-out;
        }
        .sidebar-scroll::-webkit-scrollbar {
          display: none;
        }
        .sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Top Youtube-Style Golden Progress Line */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-[var(--gold)] z-[9999] animate-top-progress origin-left" style={{
          boxShadow: '0 1px 6px var(--gold), 0 0 3px var(--gold-deep)'
        }} />
      )}

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Premium Dark Slate Theme */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 text-slate-400 border-r border-slate-900 shadow-xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-900 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-[var(--gold)] font-bold shadow-md flex-shrink-0">
              V
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in-up duration-150">
                <h1 className="text-sm font-semibold tracking-tight text-white">{t.title[language] || 'VVC Admin'}</h1>
                <p className="text-[9px] uppercase tracking-widest text-[var(--gold)] font-bold">{t.panelLabel[language]}</p>
              </div>
            )}
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-6 px-4 sidebar-scroll">
          <nav className="space-y-1.5" aria-label="Admin Navigation">
            
            <NavLink 
              to="/admin" 
              end 
              className={({ isActive }) =>
                `flex items-center rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'
                } ${
                  isActive
                    ? 'bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-white hover:translate-x-0.5'
                }`
              }
              title={isCollapsed ? t.dashboard[language] : ""}
              onClick={() => setIsSidebarOpen(false)}
            >
              <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {!isCollapsed && <span className="truncate">{t.dashboard[language]}</span>}
            </NavLink>

            {/* Catalog Group */}
            <div className="pt-6 pb-2">
              {isCollapsed ? (
                <div className="border-t border-slate-900 my-2.5 mx-2" />
              ) : (
                <p className="px-4 text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gold-deep)] mb-2.5">Catalog</p>
              )}
              <div className="space-y-1">
                <NavLink 
                  to="/admin/products" 
                  className={({ isActive }) =>
                    `flex items-center rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'
                    } ${
                      isActive
                        ? 'bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-white hover:translate-x-0.5'
                    }`
                  }
                  title={isCollapsed ? t.products[language] : ""}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {!isCollapsed && <span className="truncate">{t.products[language]}</span>}
                </NavLink>

                <NavLink 
                  to="/admin/categories" 
                  className={({ isActive }) =>
                    `flex items-center rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'
                    } ${
                      isActive
                        ? 'bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-white hover:translate-x-0.5'
                    }`
                  }
                  title={isCollapsed ? t.categories[language] : ""}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {!isCollapsed && <span className="truncate">{t.categories[language]}</span>}
                </NavLink>

                <NavLink 
                  to="/admin/banners" 
                  className={({ isActive }) =>
                    `flex items-center rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'
                    } ${
                      isActive
                        ? 'bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-white hover:translate-x-0.5'
                    }`
                  }
                  title={isCollapsed ? t.banners[language] : ""}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {!isCollapsed && <span className="truncate">{t.banners[language]}</span>}
                </NavLink>
              </div>
            </div>

            {/* System Group */}
            <div className="pt-6 pb-2">
              {isCollapsed ? (
                <div className="border-t border-slate-900 my-2.5 mx-2" />
              ) : (
                <p className="px-4 text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gold-deep)] mb-2.5">System</p>
              )}
              <div className="space-y-1">
                <NavLink 
                  to="/admin/users" 
                  className={({ isActive }) =>
                    `flex items-center rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'
                    } ${
                      isActive
                        ? 'bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-white hover:translate-x-0.5'
                    }`
                  }
                  title={isCollapsed ? t.users[language] : ""}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {!isCollapsed && <span className="truncate">{t.users[language]}</span>}
                </NavLink>

                <NavLink 
                  to="/admin/translations" 
                  className={({ isActive }) =>
                    `flex items-center rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'
                    } ${
                      isActive
                        ? 'bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-white hover:translate-x-0.5'
                    }`
                  }
                  title={isCollapsed ? t.translations[language] : ""}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {!isCollapsed && <span className="truncate">{t.translations[language]}</span>}
                </NavLink>
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer (Profile / Logout) */}
        <div className="border-t border-slate-900 p-4 bg-slate-950/20">
          <div className={`flex items-center mb-4 ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'}`}>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold)] flex items-center justify-center font-bold text-slate-900 shadow-md flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate">{user.name || 'Admin'}</span>
                <span className="text-[10px] text-slate-500 truncate">{user.email || 'admin@example.com'}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-slate-900 hover:text-rose-500 hover:border-rose-900/30 shadow-sm w-full ${
              isCollapsed ? 'px-0' : 'gap-2'
            }`}
            title={isCollapsed ? t.logout[language] : ""}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!isCollapsed && <span>{t.logout[language]}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-white/70 backdrop-blur-md border-b border-slate-200/40 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button 
              type="button" 
              onClick={toggleSidebar} 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {/* Desktop collapse toggle */}
            <button 
              type="button" 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="hidden lg:flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition border border-slate-200/60 bg-white shadow-sm"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg className="w-4 h-4 transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Breadcrumb Indicators */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>VVC</span>
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-[10px] text-slate-300 font-light">&gt;</span>
                  <span className={idx === getBreadcrumbs().length - 1 ? 'text-slate-800' : 'text-slate-400'}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center ml-auto gap-4">
            <button
              onClick={toggleLanguage}
              title={language === 'kh' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 transition duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--gold)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {tc.languageToggle[language]}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto relative">
          
          {/* API Loader Overlay (Concentric Spinner) */}
          {apiRequestsCount > 0 && !isPageLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm fade-in">
              <PageLoader language={language} t={t} />
            </div>
          )}
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            {isPageLoading ? (
              <div className="flex h-full min-h-[50vh] items-center justify-center fade-in">
                <PageLoader language={language} t={t} />
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
