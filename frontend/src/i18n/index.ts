export { I18N_KEYS } from './keys';
export { LOCALES } from './locales';
export { getInitialLanguage, getInitialProductLocale, LANGUAGE_STORAGE_KEY } from './language';
export {
  DEFAULT_PRODUCT_LOCALE,
  LOCALE_PRODUCTS,
  LOCALE_STORAGE_KEY,
  PRODUCT_LOCALE_IDS,
  PRODUCT_LOCALE_OPTIONS,
  getPersistedServiceLocale,
  persistServiceLocale,
  resolveInvitationLocale,
  resolveInvitationProductLocale,
  resolveServiceLocale,
  type ProductLocaleId,
} from './productLocales';
export { interpolate, translate } from './t';
export {
  SUPPORTED_LANGUAGES,
  type I18nKey,
  type I18nText,
  type Language,
  type LocaleDictionary,
  type Text,
  type TranslatableText,
  type UserInputText,
} from './types';
