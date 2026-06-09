import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import translations from '../../translations';
import logo from '../../assets/logo.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { language, toggleLanguage } = useLanguage();
  const { displayName, logoUrl } = useSiteSettings();
  const t = translations.adminLogin;
  const tc = translations.common;
  const brandLogo = logoUrl || logo;
  const brandName = displayName || 'Van Van Cambodia';

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const keyParam = searchParams.get('key') || searchParams.get('access_key');
    const adminSecret = import.meta.env.VITE_ADMIN_SECRET_KEY || 'vvc_secure_2026';

    if (keyParam === adminSecret) {
      setAuthorized(true);
    } else {
      // Redirect to homepage if secret query parameter is missing or incorrect
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password);

      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));

      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || t.loginFailed[language]);
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Left Column - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 text-white overflow-hidden items-center justify-center p-12">
        {/* Abstract Background Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(199,154,45,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(15,23,42,0.8),transparent_80%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        {/* Floating Glowing Orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--gold)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />

        {/* Content Wrapper */}
        <div className="relative z-10 max-w-lg space-y-12">
          {/* Logo Mark */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5 flex items-center justify-center shadow-lg">
              <img src={logo} alt="VVC Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-[var(--gold)] uppercase block">Van Van Cambodia</span>
              <span className="text-xl font-bold tracking-tight text-white block">Operations Hub</span>
            </div>
          </div>

          {/* Slogans */}
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">
              Smarter product mapping, <br />
              <span className="text-[var(--gold)]">clean catalog management.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Welcome back to the VVC Admin Studio. Authenticate to manage inventory, catalog media, localizations, and system settings in a unified, secure administrative center.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[var(--gold)] flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Catalog Engine</h4>
                <p className="text-xs text-slate-400 mt-0.5">Organize products, categories, stock, and banners.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[var(--gold)] flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">AI-Powered Tools</h4>
                <p className="text-xs text-slate-400 mt-0.5">Automatic image background removal for transparent listings.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[var(--gold)] flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Global Localizations</h4>
                <p className="text-xs text-slate-400 mt-0.5">Seamless translation controls for English and Khmer interfaces.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-6 left-12 right-12 flex justify-between text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} VVC Cambodia</span>
          <span>Version 2.1.0</span>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 md:p-20 bg-[#fffaf0] relative">

        {/* Language Toggler at Top Right */}
        <div className="flex justify-end items-center">
          <button
            onClick={toggleLanguage}
            title={language === 'kh' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--gold)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {tc.languageToggle[language]}
          </button>
        </div>

        {/* Main Card */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="text-center lg:text-left mb-8 space-y-3">
            {/* Logo for mobile only */}
            <div className="lg:hidden mx-auto h-16 w-16 items-center justify-center rounded-2xl border border-white bg-white p-2.5 shadow-sm flex mb-4">
              <img src={brandLogo} alt={brandName} className="h-12 w-12 object-contain" />
            </div>

            <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-deep)] bg-[var(--gold-soft)] rounded-full">
              {t.access[language]}
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              {t.welcomeBack[language]}
            </h2>
            <p className="text-sm text-slate-500">
              {t.loginDesc[language]}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex gap-2 items-center">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                {t.email[language]}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)] outline-none transition duration-200 text-sm"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                {t.password[language]}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)] outline-none transition duration-200 text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] text-white py-3.5 text-sm font-bold shadow-[0_4px_14px_rgba(199,154,45,0.35)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(199,154,45,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none disabled:shadow-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.loggingIn[language]}
                </>
              ) : (
                t.loginBtn[language]
              )}
            </button>
          </form>


        </div>

        {/* Footer info for mobile only */}
        <div className="lg:hidden text-center text-xs text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} VVC Cambodia
        </div>
      </div>
    </div>
  );
}
