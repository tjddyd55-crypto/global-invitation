import { SUPPORTED_LANGUAGES, type Language } from './types';

export const LANGUAGE_STORAGE_KEY = 'language';

const supportedLanguages = new Set<string>(SUPPORTED_LANGUAGES);

function isSupportedLanguage(value: string | null | undefined): value is Language {
  return !!value && supportedLanguages.has(value);
}

function getStoredLanguage(): Language | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

function getCookieLanguage(): Language | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookiePairs = document.cookie.split(';');
  for (const pair of cookiePairs) {
    const [rawKey, rawValue] = pair.trim().split('=');
    if (!rawKey || !rawValue) {
      continue;
    }

    if (rawKey === LANGUAGE_STORAGE_KEY) {
      const decoded = decodeURIComponent(rawValue);
      return isSupportedLanguage(decoded) ? decoded : null;
    }
  }

  return null;
}

function getBrowserLanguage(): Language | null {
  if (typeof navigator === 'undefined' || typeof navigator.language !== 'string') {
    return null;
  }

  const normalized = navigator.language.toLowerCase();

  if (normalized.startsWith('ko')) {
    return 'ko';
  }

  if (normalized.startsWith('mn')) {
    return 'mn';
  }

  return 'en';
}

export function getInitialLanguage(): Language {
  return (
    getStoredLanguage() ||
    getCookieLanguage() ||
    getBrowserLanguage() ||
    'en'
  );
}
