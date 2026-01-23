'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getInitialLanguage, LANGUAGE_STORAGE_KEY, translate, type Language } from '../i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language on mount (user choice -> browser -> fallback)
  useEffect(() => {
    const initialLanguage = getInitialLanguage();
    setLanguageState(initialLanguage);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // localStorage unavailable; ignore
    }
  };

  const t = (key: string): string => {
    return translate(language, key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
