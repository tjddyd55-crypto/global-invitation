/**
 * Locale Product Mode SSOT.
 *
 * locale ≠ UI translation toggle.
 * locale = KO/EN service mode (marketing + create + editor + invitation snapshot).
 *
 * Dictionary stays in `locales/*`. This module owns product ids, persistence, and resolve order.
 */

export const PRODUCT_LOCALE_IDS = ['ko-KR', 'en-US'] as const;
export type ProductLocaleId = (typeof PRODUCT_LOCALE_IDS)[number];

export const DEFAULT_PRODUCT_LOCALE: ProductLocaleId = 'ko-KR';
export const LEGACY_INVITATION_LOCALE: ProductLocaleId = 'ko-KR';

export const LOCALE_STORAGE_KEY = 'gi_locale';
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type LocaleProduct = {
  id: ProductLocaleId;
  label: string;
  language: 'ko' | 'en';
  region: 'KR' | 'US';
  dateLocale: ProductLocaleId;
  currency: 'USD';
  defaultCountry: 'KR' | 'US';
  htmlLang: 'ko' | 'en';
};

export const LOCALE_PRODUCTS: Record<ProductLocaleId, LocaleProduct> = {
  'ko-KR': {
    id: 'ko-KR',
    label: '한국어',
    language: 'ko',
    region: 'KR',
    dateLocale: 'ko-KR',
    currency: 'USD',
    defaultCountry: 'KR',
    htmlLang: 'ko',
  },
  'en-US': {
    id: 'en-US',
    label: 'English',
    language: 'en',
    region: 'US',
    dateLocale: 'en-US',
    currency: 'USD',
    defaultCountry: 'US',
    htmlLang: 'en',
  },
};

export const PRODUCT_LOCALE_OPTIONS = PRODUCT_LOCALE_IDS.map((id) => LOCALE_PRODUCTS[id]);

const PRODUCT_LOCALE_SET = new Set<string>(PRODUCT_LOCALE_IDS);

export function isProductLocaleId(value: string | null | undefined): value is ProductLocaleId {
  return Boolean(value && PRODUCT_LOCALE_SET.has(value));
}

/**
 * Invitation + service locale normalizer.
 * Legacy `ko` / `en` / `mn` / missing → product locale. Unknown → ko-KR.
 */
export function resolveInvitationLocale(value: string | null | undefined): ProductLocaleId {
  const raw = (value || '').trim();
  if (isProductLocaleId(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower === 'en' || lower.startsWith('en-')) return 'en-US';
  if (lower === 'ko' || lower.startsWith('ko-')) return 'ko-KR';
  return LEGACY_INVITATION_LOCALE;
}

export function languageFromLocale(locale: ProductLocaleId): 'ko' | 'en' {
  return LOCALE_PRODUCTS[locale].language;
}

export function localeFromLanguage(language: string | null | undefined): ProductLocaleId {
  return resolveInvitationLocale(language);
}

export function htmlLangFromLocale(locale: ProductLocaleId): 'ko' | 'en' {
  return LOCALE_PRODUCTS[locale].htmlLang;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const pairs = document.cookie.split(';');
  for (const pair of pairs) {
    const [rawKey, rawValue] = pair.trim().split('=');
    if (!rawKey || rawValue == null || rawValue === '') continue;
    if (rawKey === name) return decodeURIComponent(rawValue);
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function readLocalStorage(name: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeLocalStorage(name: string, value: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(name, value);
  } catch {
    // private mode / quota — persistence still has cookie
  }
}

function resolveBrowserLocale(): ProductLocaleId | null {
  if (typeof navigator === 'undefined' || typeof navigator.language !== 'string') {
    return null;
  }
  const normalized = navigator.language.toLowerCase();
  if (normalized.startsWith('ko')) return 'ko-KR';
  if (normalized.startsWith('en')) return 'en-US';
  return null;
}

/**
 * Service locale resolve order:
 * 1. gi_locale storage
 * 2. gi_locale cookie
 * 3. legacy `language` storage/cookie (ko|en|mn)
 * 4. browser Accept-Language / navigator.language
 * 5. ko-KR
 */
export function resolveServiceLocale(input?: {
  storedLocale?: string | null;
  cookieLocale?: string | null;
  storedLanguage?: string | null;
  cookieLanguage?: string | null;
  browserLanguage?: string | null;
}): ProductLocaleId {
  if (isProductLocaleId(input?.storedLocale)) return input.storedLocale;
  if (isProductLocaleId(input?.cookieLocale)) return input.cookieLocale;
  if (input?.storedLanguage) return localeFromLanguage(input.storedLanguage);
  if (input?.cookieLanguage) return localeFromLanguage(input.cookieLanguage);

  const browser = (input?.browserLanguage || '').toLowerCase();
  if (browser.startsWith('en')) return 'en-US';
  if (browser.startsWith('ko')) return 'ko-KR';
  if (input && 'browserLanguage' in input) return DEFAULT_PRODUCT_LOCALE;

  return resolveBrowserLocale() || DEFAULT_PRODUCT_LOCALE;
}

export function getPersistedServiceLocale(): ProductLocaleId {
  return resolveServiceLocale({
    storedLocale: readLocalStorage(LOCALE_STORAGE_KEY),
    cookieLocale: readCookie(LOCALE_STORAGE_KEY),
    storedLanguage: readLocalStorage('language'),
    cookieLanguage: readCookie('language'),
    browserLanguage: typeof navigator !== 'undefined' ? navigator.language : null,
  });
}

export function persistServiceLocale(locale: ProductLocaleId): void {
  const language = languageFromLocale(locale);
  writeLocalStorage(LOCALE_STORAGE_KEY, locale);
  writeLocalStorage('language', language);
  writeCookie(LOCALE_STORAGE_KEY, locale);
  writeCookie('language', language);
}

export function hasExplicitLocaleChoice(): boolean {
  return Boolean(readLocalStorage(LOCALE_STORAGE_KEY) || readLocalStorage('language'));
}
