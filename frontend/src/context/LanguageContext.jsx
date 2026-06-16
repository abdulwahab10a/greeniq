import { createContext, useContext, useEffect, useState } from 'react';
import { EN, builders } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('greeniq_lang') || 'ar'
  );

  useEffect(() => {
    localStorage.setItem('greeniq_lang', lang);
    // Update the document language for semantics/accessibility.
    // The layout itself is left untouched so the Arabic UI stays as-is.
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang(l => (l === 'ar' ? 'en' : 'ar'));

  // Arabic is the source/default: in Arabic, return the key unchanged.
  const t = (key) => {
    if (key == null) return key;
    if (lang === 'ar') return key;
    return EN[key] ?? key;
  };

  // Language-aware builders for dynamic/interpolated strings.
  const b = Object.fromEntries(
    Object.entries(builders).map(([name, fn]) => [name, (...args) => fn(lang, ...args)])
  );

  return (
    <LanguageContext.Provider value={{ lang, toggle, t, b }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
