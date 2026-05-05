import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import logo from '../../assets/logo.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { language, toggleLanguage } = useLanguage();
  const t = translations.adminLogin;
  const tc = translations.common;

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

  return (
    <div className="mesh-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md rounded-3xl p-10 page-fade">

        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLanguage}
            title={language === 'kh' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
            className="flex items-center gap-1.5 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--gold)] transition hover:bg-[var(--gold)]/15"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {tc.languageToggle[language]}
          </button>
        </div>

        <div className="text-center reveal">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/90 p-2 shadow-sm">
            <img src={logo} alt="Van Van Cambodia" className="h-10 w-10 object-contain" />
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.4em] text-slate-500">{t.access[language]}</p>
          <h1 className="mt-4 text-4xl font-semibold">{t.welcomeBack[language]}</h1>
          <p className="mt-3 text-sm text-slate-600">{t.loginDesc[language]}</p>
        </div>

        {error && <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 reveal">{error}</div>}

        <form onSubmit={handleLogin} className="mt-6 space-y-5 reveal reveal-delay-1">
          <div>
            <label className="block text-sm font-semibold text-slate-700">{t.email[language]}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">{t.password[language]}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? t.loggingIn[language] : t.loginBtn[language]}
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-white/70 p-4 text-xs text-slate-600 reveal reveal-delay-2">
          <p className="font-semibold text-slate-700">{t.demoCredentials[language]}</p>
          <p className="mt-2">{t.email[language]}: admin@example.com</p>
          <p>{t.password[language]}: password123</p>
        </div>
      </div>
    </div>
  );
}
