import { LOCALES } from './locales';
import type { I18nKey, Language, LocaleDictionary } from './types';

function getValue(dictionary: LocaleDictionary, key: I18nKey | string): string | undefined {
  const value = dictionary[key as I18nKey];
  return typeof value === 'string' ? value : undefined;
}

export function translate(language: Language, key: I18nKey | string): string {
  return getValue(LOCALES[language], key) ?? key;
}
