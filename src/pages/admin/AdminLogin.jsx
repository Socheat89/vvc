import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

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
      <div className="glass-card w-full max-w-md rounded-3xl p-8">
        <div className="mb-4 flex justify-end">
          <button
            onClick={toggleLanguage}
            title={language === 'kh' ? 'Switch to English' : 'Switch to Khmer'}
            className="flex items-center gap-1.5 rounded-full border border-[var(--ember)]/40 bg-[var(--ember)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--ember)] transition hover:bg-[var(--ember)]/15"
          >
            <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
            {tc.languageToggle[language]}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{t.access[language]}</p>
          <h1 className="mt-4 text-4xl font-semibold">{t.welcomeBack[language]}</h1>
          <p className="mt-3 text-sm text-slate-600">{t.loginDesc[language]}</p>
        </div>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700">{t.email[language]}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm focus:border-[var(--ember)] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">{t.password[language]}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm focus:border-[var(--ember)] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faRightToBracket} className="h-4 w-4" />
              {loading ? t.loggingIn[language] : t.loginBtn[language]}
            </span>
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-white/70 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">{t.demoCredentials[language]}</p>
          <p className="mt-2">{t.email[language]}: admin@example.com</p>
          <p>{t.password[language]}: password123</p>
        </div>
      </div>
    </div>
  );
}
