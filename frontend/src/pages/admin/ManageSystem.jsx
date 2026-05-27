import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { systemService } from '../../services/api';

export default function ManageSystem() {
  const { language } = useLanguage();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      const res = await systemService.getStatus();
      setStatus(res.data?.data || null);
      setErrorMessage('');
    } catch (err) {
      console.error(err);
      setErrorMessage(
        language === 'kh'
          ? 'មិនអាចទាក់ទងទៅកាន់ Backend API បានទេ។ សូមពិនិត្យមើលការភ្ជាប់របស់ម៉ាស៊ីនមេ។'
          : 'Could not connect to the Backend API. Please check your server status.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setActionLoading(true);
      setSuccessMessage('');
      setErrorMessage('');
      setConsoleOutput('');

      const res = await systemService.clearCache();
      
      setSuccessMessage(
        language === 'kh' ? 'បានសម្អាត Cache របស់ប្រព័ន្ធដោយជោគជ័យ!' : 'System cache cleared successfully!'
      );
      
      const details = res.data?.details || {};
      const output = `[Cache Clear Output]\n${details.cache || ''}\n\n[Config Clear Output]\n${details.config || ''}\n\n[Route Clear Output]\n${details.route || ''}`;
      setConsoleOutput(output);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || (language === 'kh' ? 'ការសម្អាត Cache បានបរាជ័យ។' : 'Failed to clear system cache.')
      );
      if (err.response?.data?.error) {
        setConsoleOutput(`[Error Details]\n${err.response.data.error}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunMigrations = async () => {
    setShowMigrateConfirm(false);
    try {
      setActionLoading(true);
      setSuccessMessage('');
      setErrorMessage('');
      setConsoleOutput('');

      const res = await systemService.runMigrations();
      
      if (res.data?.success) {
        setSuccessMessage(
          language === 'kh' ? 'បានដំណើរការ Migration ដោយជោគជ័យ!' : 'Migrations executed successfully!'
        );
      } else {
        setErrorMessage(
          language === 'kh' ? 'ការដំណើរការ Migration មានបញ្ហា។' : 'Migrations completed with errors.'
        );
      }
      setConsoleOutput(res.data?.output || 'No output returned.');
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || (language === 'kh' ? 'ដំណើរការ Migration បានបរាជ័យ។' : 'Failed to run migrations.')
      );
      if (err.response?.data?.error) {
        setConsoleOutput(`[Error Details]\n${err.response.data.error}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-10 w-56 rounded bg-slate-200/60" />
        <div className="grid gap-6 md:grid-cols-4">
          <div className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
          <div className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
          <div className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
          <div className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
        </div>
        <div className="h-64 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div>
          <span className="inline-block px-3 py-1 mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-deep)] bg-[var(--gold-soft)] shadow-sm rounded-full">
            System Control Center
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {language === 'kh' ? 'គ្រប់គ្រងប្រព័ន្ធ API' : 'System & API Console'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            {language === 'kh'
              ? 'ត្រួតពិនិត្យស្ថានភាពរបស់ Backend API, Database និងគ្រប់គ្រង Cache របស់ម៉ាស៊ីនមេ។'
              : 'Monitor backend API status, database linkages, system configurations, and execute console operations.'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchSystemStatus}
          disabled={actionLoading}
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {language === 'kh' ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Refresh Status'}
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2 items-center">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex gap-2 items-center">
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Health Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 reveal">
        {/* API Health */}
        <div className="glass-card rounded-2xl p-5 bg-white/70 border border-slate-100/60 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">API Connection</p>
            <p className="mt-4 text-xl font-bold text-slate-800">
              {status ? (language === 'kh' ? 'ភ្ជាប់ជោគជ័យ' : 'Connected') : (language === 'kh' ? 'ដាច់ការភ្ជាប់' : 'Disconnected')}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${status ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] text-slate-500 font-semibold uppercase">{status ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Database Health */}
        <div className="glass-card rounded-2xl p-5 bg-white/70 border border-slate-100/60 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Connection</p>
            <p className="mt-4 text-xl font-bold text-slate-800">
              {status?.database?.connected ? (language === 'kh' ? 'ភ្ជាប់ជោគជ័យ' : 'Connected') : (language === 'kh' ? 'បរាជ័យ' : 'Failed')}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${status?.database?.connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-[10px] text-slate-500 font-bold uppercase">{status?.database?.driver || 'N/A'}</span>
            </div>
            {status?.database?.connected && (
              <span className="text-[10px] text-slate-400 font-mono font-semibold max-w-[100px] truncate">
                {status.database.database_name}
              </span>
            )}
          </div>
        </div>

        {/* Framework Status */}
        <div className="glass-card rounded-2xl p-5 bg-white/70 border border-slate-100/60 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Laravel Version</p>
            <p className="mt-4 text-xl font-bold text-slate-800">v{status?.laravel_version || 'N/A'}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Env:</span>
            <span className="text-[10px] font-bold text-[var(--gold-deep)] bg-[var(--gold-soft)] px-2 py-0.5 rounded uppercase tracking-wider">
              {status?.environment || 'local'}
            </span>
          </div>
        </div>

        {/* PHP Health */}
        <div className="glass-card rounded-2xl p-5 bg-white/70 border border-slate-100/60 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PHP Environment</p>
            <p className="mt-4 text-xl font-bold text-slate-800">PHP {status?.php_version || 'N/A'}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Cache Driver:</span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
              {status?.cache?.driver || 'file'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Console Grid */}
      <div className="grid gap-6 md:grid-cols-2 reveal reveal-delay-1">
        {/* Cache controller */}
        <div className="glass-card rounded-2xl p-6 bg-white/80 border border-slate-100/60 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">
              {language === 'kh' ? 'គ្រប់គ្រង Cache' : 'System Cache Management'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'kh'
                ? 'សម្អាតទិន្នន័យចាស់ៗដែលបានផ្ទុក (Cache) ដើម្បីបង្ហាញទិន្នន័យបច្ចុប្បន្នភាពចុងក្រោយបង្អស់។'
                : 'Flush application caching pipelines, configuration caches, and route registries to load updates.'}
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {language === 'kh'
              ? 'ការសម្អាត Cache នឹងលុបការចងចាំរាល់ទិន្នន័យចាស់ៗ ជំនួសមកវិញដោយការទាញយកទិន្នន័យផ្ទាល់ពី Database នៅរាល់ពេលមានសំណើថ្មីៗ។'
              : 'Flushing system cache clears temporary records, forcing Laravel to compile fresh config maps and retrieve products/banners directly from the Database.'}
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={handleClearCache}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(199,154,45,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(199,154,45,0.6)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {actionLoading ? (language === 'kh' ? 'កំពុងដំណើរការ...' : 'Executing...') : (language === 'kh' ? 'សម្អាត Cache' : 'Clear System Cache')}
            </button>
          </div>
        </div>

        {/* Migrate controller */}
        <div className="glass-card rounded-2xl p-6 bg-white/80 border border-slate-100/60 shadow-sm space-y-6 border-l-4 border-l-amber-500">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {language === 'kh' ? 'ដំណើរការ Database Migration' : 'Run Database Migrations'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'kh'
                ? 'ដំណើរការ Artisan commands ដើម្បីតំឡើង ឬកែប្រែតារាងទិន្នន័យ (Database Tables)។'
                : 'Run artisan migration commands directly on the server host to instantiate schema changes.'}
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {language === 'kh'
              ? 'សកម្មភាពនេះនឹងដំណើរការ `php artisan migrate --force` នៅលើម៉ាស៊ីនមេ សម្រាប់បង្កើតតារាងបកប្រែ (Translations) និងតារាងផ្សេងៗទៀត។'
              : 'This performs `php artisan migrate --force` to instantiate any newly uploaded migrations (e.g. creating the translations table) on the backend DB.'}
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setShowMigrateConfirm(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {language === 'kh' ? 'ដំណើរការ Migration' : 'Run Migrations'}
            </button>
          </div>
        </div>
      </div>

      {/* Console Output Block */}
      {consoleOutput && (
        <div className="glass-card rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-xl reveal reveal-delay-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Console Command Output Log</span>
            <button
              onClick={() => setConsoleOutput('')}
              className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
            >
              {language === 'kh' ? 'បិទ' : 'Close'}
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-400 bg-black/40 p-4 rounded-xl overflow-x-auto leading-relaxed max-h-[300px] border border-slate-950">
            {consoleOutput}
          </pre>
        </div>
      )}

      {/* Migration Confirmation Modal */}
      {showMigrateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm page-fade">
          <div className="bg-white border border-slate-200/60 w-full max-w-md rounded-2xl p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-600 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'kh' ? 'តើអ្នកប្រាកដជាចង់ដំណើរការមែនទេ?' : 'Execute Database Migrations?'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {language === 'kh'
                ? 'សកម្មភាពនេះនឹងដំណើរការកូដផ្លាស់ប្តូរទិន្នន័យលើ Database។ សូមប្រាកដថាលោកអ្នកមានសំណៅចម្លង (Backup) ត្រឹមត្រូវ។'
                : 'This will trigger database schema updates on the live server. Please verify your settings before proceeding.'}
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowMigrateConfirm(false)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
              >
                {language === 'kh' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleRunMigrations}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-slate-800 shadow-sm"
              >
                {language === 'kh' ? 'យល់ព្រមដំណើរការ' : 'Confirm & Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
