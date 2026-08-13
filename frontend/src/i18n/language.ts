import { getPersistedServiceLocale, languageFromLocale, type ProductLocaleId } from './productLocales';
import { SUPPORTED_LANGUAGES, type Language } from './types';

export const LANGUAGE_STORAGE_KEY = 'language';

const supportedLanguages = new Set<string>(SUPPORTED_LANGUAGES);

function isSupportedLanguage(value: string | null | undefined): value is Language {
  return !!value && supportedLanguages.has(value);
}

/** @deprecated use getPersistedServiceLocale — kept for existing callers */
export function getInitialLanguage(): Language {
  const locale = getPersistedServiceLocale();
  const language = languageFromLocale(locale);
  return isSupportedLanguage(language) ? language : 'ko';
}

export function getInitialProductLocale(): ProductLocaleId {
  return getPersistedServiceLocale();
}
