import type { I18N_KEYS } from './keys';

type NestedValues<T> = T extends Record<string, infer V> ? NestedValues<V> : T;
export type I18nKey = NestedValues<typeof I18N_KEYS>;

export type LocaleDictionary = Record<I18nKey, string>;

export const SUPPORTED_LANGUAGES = ['en', 'ko', 'mn'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type Text = string;
export type I18nText = I18nKey;
export type TranslatableText = I18nText;
export type UserInputText = string;
