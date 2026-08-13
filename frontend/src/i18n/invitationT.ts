import { interpolate, translate } from './t';
import {
  languageFromLocale,
  resolveInvitationLocale,
  type ProductLocaleId,
} from './productLocales';

export function invitationT(
  locale: string | null | undefined,
  key: string,
  vars?: Record<string, string | number>
): string {
  const resolved = resolveInvitationLocale(locale);
  const text = translate(languageFromLocale(resolved), key);
  return vars ? interpolate(text, vars) : text;
}

export function editorProductLocale(language: string | null | undefined): ProductLocaleId {
  return resolveInvitationLocale(language);
}
