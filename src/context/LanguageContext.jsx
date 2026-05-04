import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('vvc_language') || 'kh'
  );

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'kh' ? 'en' : 'kh';
      localStorage.setItem('vvc_language', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
