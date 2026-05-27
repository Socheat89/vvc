import React, { createContext, useContext, useEffect, useState } from 'react';
import { translationService } from '../services/api';
import appTranslations from '../translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('vvc_language') || 'kh'
  );
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    document.documentElement.lang = language === 'kh' ? 'km' : 'en';
  }, [language]);

  useEffect(() => {
    translationService.getAll()
      .then(res => {
        const dbList = res.data?.data || [];
        if (dbList.length > 0) {
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

          const prevOverridesStr = localStorage.getItem('vvc_custom_translations');
          const newOverridesStr = JSON.stringify(overrides);

          if (prevOverridesStr !== newOverridesStr) {
            localStorage.setItem('vvc_custom_translations', newOverridesStr);

            // Merge into active translation singleton
            Object.keys(overrides).forEach((category) => {
              if (appTranslations[category]) {
                Object.keys(overrides[category]).forEach((key) => {
                  if (appTranslations[category][key]) {
                    appTranslations[category][key].en = overrides[category][key].en;
                    appTranslations[category][key].kh = overrides[category][key].kh;
                  }
                });
              }
            });

            // Force re-render of components using translations
            setSyncKey(prev => prev + 1);
          }
        }
      })
      .catch(err => {
        console.error('Failed to background sync translations:', err);
      });
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'kh' ? 'en' : 'kh';
      localStorage.setItem('vvc_language', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, syncKey }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

