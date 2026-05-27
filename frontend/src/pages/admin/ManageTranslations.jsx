import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import { translationService } from '../../services/api';

// Helper to flatten translations recursively
function flattenTranslations(obj, path = '') {
  let results = [];
  if (!obj || typeof obj !== 'object') return results;

  // Check if it is a leaf node containing en and kh
  if (obj.en !== undefined && obj.kh !== undefined) {
    results.push({
      path,
      en: obj.en,
      kh: obj.kh,
      // Store original values from file for default comparison
      originalEn: obj.en,
      originalKh: obj.kh
    });
    return results;
  }

  // Otherwise, recurse
  Object.keys(obj).forEach((key) => {
    const childPath = path ? `${path}.${key}` : key;
    results = results.concat(flattenTranslations(obj[key], childPath));
  });

  return results;
}

const ITEMS_PER_PAGE = 10;

export default function ManageTranslations() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ en: '', kh: '' });

  // Load flattened translations list with local storage cache fallback
  const [items, setItems] = useState(() => {
    const flatList = flattenTranslations(translations);
    try {
      const overridesStr = localStorage.getItem('vvc_custom_translations');
      if (overridesStr) {
        const overrides = JSON.parse(overridesStr);
        return flatList.map(item => {
          const parts = item.path.split('.');
          let current = overrides;
          let found = true;
          for (let part of parts) {
            if (current && current[part]) {
              current = current[part];
            } else {
              found = false;
              break;
            }
          }
          if (found && current && current.en !== undefined && current.kh !== undefined) {
            return { ...item, en: current.en, kh: current.kh };
          }
          return item;
        });
      }
    } catch (e) {
      console.error('Error loading custom overrides in editor state:', e);
    }
    return flatList;
  });

  useEffect(() => {
    let active = true;
    translationService.getAll()
      .then(res => {
        if (!active) return;
        const dbList = Array.isArray(res.data?.data) ? res.data.data : [];
        if (dbList.length > 0) {
          const dbMapping = {};
          dbList.forEach(item => {
            dbMapping[item.key] = { en: item.en, kh: item.kh };
          });

          setItems(prevItems => prevItems.map(item => {
            if (dbMapping[item.path]) {
              return {
                ...item,
                en: dbMapping[item.path].en,
                kh: dbMapping[item.path].kh
              };
            }
            return item;
          }));

          // Sync local storage with latest API values
          const overrides = {};
          dbList.forEach(item => {
            const parts = item.key.split('.');
            let current = overrides;
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!current[part]) current[part] = {};
              current = current[part];
            }
            const lastPart = parts[parts.length - 1];
            current[lastPart] = { en: item.en, kh: item.kh };
          });
          localStorage.setItem('vvc_custom_translations', JSON.stringify(overrides));
        }
      })
      .catch(err => {
        console.error('Failed to load translations from backend API:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);


  // Track categories for filter dropdown
  const categories = useMemo(() => {
    const cats = new Set();
    items.forEach(item => {
      const category = item.path.split('.')[0];
      if (category) cats.add(category);
    });
    return Array.from(cats).sort();
  }, [items]);

  // Handle local text inputs
  const handleValueChange = (path, lang, val) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.path === path) {
          return { ...item, [lang]: val };
        }
        return item;
      })
    );
  };

  // Filtered list
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter(item => {
      const firstPart = item.path.split('.')[0];
      const matchesCategory = selectedCategory === 'all' || firstPart === selectedCategory;
      
      const matchesSearch =
        !term ||
        item.path.toLowerCase().includes(term) ||
        item.en.toLowerCase().includes(term) ||
        item.kh.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [items, searchTerm, selectedCategory]);

  // Pagination details
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const paginatedItems = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPageSafe, filteredItems]);

  const pageItems = useMemo(() => {
    const list = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
      return list;
    }
    list.push(1);
    if (currentPageSafe > 3) list.push('ellipsis-start');
    const start = Math.max(2, currentPageSafe - 1);
    const end = Math.min(totalPages - 1, currentPageSafe + 1);
    for (let i = start; i <= end; i++) list.push(i);
    if (currentPageSafe < totalPages - 2) list.push('ellipsis-end');
    list.push(totalPages);
    return list;
  }, [currentPageSafe, totalPages]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = items.length;
    const modified = items.filter(item => item.en !== item.originalEn || item.kh !== item.originalKh).length;
    return { total, modified };
  }, [items]);

  // Save changes to backend and sync locally
  const handleSave = async () => {
    try {
      const overrides = {};
      const payload = [];

      items.forEach(item => {
        if (item.en !== item.originalEn || item.kh !== item.originalKh) {
          const parts = item.path.split('.');
          let current = overrides;
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          const lastPart = parts[parts.length - 1];
          current[lastPart] = { en: item.en, kh: item.kh };

          payload.push({
            key: item.path,
            en: item.en,
            kh: item.kh
          });
        }
      });

      // Save payload to the server
      await translationService.save(payload);

      // Save fallback mapping in storage
      localStorage.setItem('vvc_custom_translations', JSON.stringify(overrides));

      // Apply directly to imported singleton reference
      items.forEach(item => {
        const parts = item.path.split('.');
        let current = translations;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }
        const lastPart = parts[parts.length - 1];
        if (current && current[lastPart]) {
          current[lastPart].en = item.en;
          current[lastPart].kh = item.kh;
        }
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        // Force refresh application context
        window.location.reload();
      }, 1500);
    } catch (e) {
      console.error(e);
      alert(language === 'kh' ? 'រក្សាទុកការបកប្រែមិនបានសម្រេចឡើយ។' : 'Failed to save translations.');
    }
  };

  // Reset all translations to default
  const handleReset = async () => {
    const confirmReset = window.confirm(
      language === 'kh' 
        ? 'តើអ្នកចង់កំណត់ឡើងវិញនូវការបកប្រែទាំងអស់ទៅតាមលំនាំដើមរបស់ប្រព័ន្ធមែនទេ?' 
        : 'Are you sure you want to reset all translations to default values?'
    );
    
    if (!confirmReset) return;

    try {
      // Call reset API on server
      await translationService.reset();

      localStorage.removeItem('vvc_custom_translations');
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (e) {
      console.error(e);
      alert(language === 'kh' ? 'ការកំណត់ឡើងវិញបានបរាជ័យ។' : 'Failed to reset translations.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.path === editingItem.path) {
          return { ...item, en: editForm.en, kh: editForm.kh };
        }
        return item;
      })
    );
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-56 rounded bg-slate-200/60" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
          <div className="h-28 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
        </div>
        <div className="h-14 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
        <div className="h-96 rounded-2xl bg-white/70 border border-slate-100 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div>
          <span className="inline-block px-3 py-1 mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-deep)] bg-[var(--gold-soft)] shadow-sm rounded-full">
            Localization Settings
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {language === 'kh' ? 'គ្រប់គ្រងភាសា' : 'Manage Translations'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            {language === 'kh'
              ? 'កែប្រែនិងបន្ថែមភាសាបកប្រែនៅក្នុងប្រព័ន្ធ។ រាល់ការផ្លាស់ប្តូរនឹងអនុវត្តភ្លាមៗលើទំព័រទាំងអស់។'
              : 'Edit and manage interface translation keys across the system. Changes apply instantly.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={stats.modified === 0}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 transition hover:bg-rose-50 hover:border-rose-200 shadow-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            {language === 'kh' ? 'កំណត់លំនាំដើមឡើងវិញ' : 'Reset to Default'}
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-[var(--gold)] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(199,154,45,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(199,154,45,0.6)] hover:-translate-y-0.5 active:translate-y-0"
          >
            {language === 'kh' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Save Alerts */}
      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex gap-2 items-center animate-pulse">
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold">
            {language === 'kh' ? 'រក្សាទុកជោគជ័យ! កំពុងដំណើរការប្រព័ន្ធឡើងវិញ...' : 'Saved successfully! Reloading system...'}
          </span>
        </div>
      )}

      {resetSuccess && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex gap-2 items-center animate-pulse">
          <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold">
            {language === 'kh' ? 'បានកំណត់ឡើងវិញជោគជ័យ! កំពុងផ្ទុកឡើងវិញ...' : 'Reset successful! Reloading page...'}
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-3 reveal">
        <div className="glass-card rounded-2xl p-5 bg-white/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'kh' ? 'សោភាសាសរុប' : 'Total Translation Keys'}
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-800">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-white/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'kh' ? 'សោដែលបានកែប្រែ' : 'Modified Overrides'}
          </p>
          <p className={`mt-4 text-3xl font-semibold ${stats.modified > 0 ? 'text-[var(--gold-deep)]' : 'text-slate-800'}`}>
            {stats.modified}
          </p>
        </div>
      </div>

      {/* Control Bar (Filters & Search) */}
      <div className="glass-card rounded-2xl p-4 bg-white/80 border border-slate-100/60 shadow-sm reveal reveal-delay-1">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_auto]">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'kh' ? 'ស្វែងរកសោ ភាសាខ្មែរ ឬ អង់គ្លេស...' : 'Search by key, English, or Khmer values...'}
              className="w-full rounded-xl border border-slate-200 bg-white/80 pl-10 pr-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]"
            aria-label="Category filter"
          >
            <option value="all">{language === 'kh' ? 'គ្រប់ផ្នែកទាំងអស់' : 'All Namespaces'}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
          >
            {language === 'kh' ? 'កំណត់ឡើងវិញ' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Main Keys List Card */}
      <div className="glass-card overflow-hidden rounded-2xl bg-white/80 border border-slate-100/60 shadow-sm reveal reveal-delay-2">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">{language === 'kh' ? 'បញ្ជីសោបកប្រែ' : 'Translation Catalog'}</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {filteredItems.length} {language === 'kh' ? 'លទ្ធផល' : 'results found'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-16">No.</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Key Path / Namespace</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right w-24">{language === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item, index) => {
                const isModified = item.en !== item.originalEn || item.kh !== item.originalKh;
                const itemIndex = (currentPageSafe - 1) * ITEMS_PER_PAGE + index + 1;
                return (
                  <tr key={item.path} className={`transition hover:bg-slate-50/30 group ${isModified ? 'bg-[var(--gold-soft)]/20' : ''}`}>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 align-middle">{itemIndex}</td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="font-mono text-xs text-slate-800 break-all font-semibold select-all">{item.path}</div>
                        {isModified && (
                          <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-[var(--gold-soft)] border border-[var(--gold)]/20 text-[var(--gold-deep)] rounded">
                            {language === 'kh' ? 'បានកែប្រែ' : 'Modified'}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-400 font-medium bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-start gap-1">
                          <span className="text-slate-500 font-bold flex-shrink-0">EN:</span>
                          <span className="text-slate-600 break-words line-clamp-2">{item.en || '-'}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-slate-500 font-bold flex-shrink-0">KH:</span>
                          <span className="text-slate-600 break-words line-clamp-2">{item.kh || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setEditForm({ en: item.en, kh: item.kh });
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-[var(--gold-deep)] hover:bg-[var(--gold-soft)] hover:border-[var(--gold)]/30 shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
                        title={language === 'kh' ? 'កែប្រែ' : 'Edit'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredItems.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/30 px-6 py-4 text-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Page {currentPageSafe} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPageSafe === 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Prev
              </button>

              <div className="flex items-center gap-1.5">
                {pageItems.map((item, idx) =>
                  typeof item === 'number' ? (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-8 w-8 rounded-full text-xs font-bold transition duration-150 ${
                        item === currentPageSafe
                          ? 'bg-[var(--gold)] text-white shadow-sm shadow-[var(--gold)]/30'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-slate-400 text-xs font-bold">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPageSafe === totalPages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="px-6 py-16 text-center text-slate-500 text-sm font-semibold">
            No matching translation keys found.
          </div>
        )}
      </div>

      {/* Edit Modal Popup */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-sm page-fade animate-fade-in">
          <div className="bg-[#fffaf0] border border-slate-200/60 w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl reveal animate-scale-up">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200/50 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {language === 'kh' ? 'កែប្រែភាសាបកប្រែ' : 'Edit Translation'}
                </h2>
                <p className="mt-2 text-[11px] font-mono text-slate-500 break-all bg-slate-100/60 p-2 rounded-xl border border-slate-200/40 select-all font-semibold">
                  {editingItem.path}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/60 text-slate-500 transition hover:bg-slate-200"
              >
                <span aria-hidden="true" className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  English (EN)
                </label>
                <textarea
                  value={editForm.en}
                  onChange={(e) => setEditForm({ ...editForm, en: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)] leading-relaxed resize-y"
                  rows="4"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Khmer (KH)
                </label>
                <textarea
                  value={editForm.kh}
                  onChange={(e) => setEditForm({ ...editForm, kh: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)] leading-relaxed resize-y"
                  rows="4"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200/50 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
                >
                  {language === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--gold)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_14px_rgba(199,154,45,0.4)]"
                >
                  {language === 'kh' ? 'រក្សាទុក' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
