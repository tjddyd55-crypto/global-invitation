'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate, type Language } from '../i18n';
import {
  getPersistedServiceLocale,
  htmlLangFromLocale,
  languageFromLocale,
  localeFromLanguage,
  persistServiceLocale,
  type ProductLocaleId,
} from '../i18n/productLocales';

interface I18nContextType {
  locale: ProductLocaleId;
  setLocale: (locale: ProductLocaleId) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<ProductLocaleId>('ko-KR');

  useEffect(() => {
    const next = getPersistedServiceLocale();
    setLocaleState(next);
    persistServiceLocale(next);
    document.documentElement.lang = htmlLangFromLocale(next);
  }, []);

  const applyLocale = (next: ProductLocaleId) => {
    setLocaleState(next);
    persistServiceLocale(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = htmlLangFromLocale(next);
    }
  };

  const setLanguage = (lang: Language) => {
    applyLocale(localeFromLanguage(lang));
  };

  const language = languageFromLocale(locale);
  const t = useMemo(() => {
    return (key: string): string => translate(language, key);
  }, [language]);

  return (
    <I18nContext.Provider value={{ locale, setLocale: applyLocale, language, setLanguage, t }}>
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

export function useTranslations() {
  return useI18n().t;
}
