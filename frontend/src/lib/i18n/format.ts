import { languageFromLocale, resolveInvitationLocale } from '@/src/i18n/productLocales';
import { translate } from '@/src/i18n/t';

const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  mn: 'mn-MN',
};

// NOTE: 날짜/시간 출력은 formatDate/formatTime/formatDateTime만 사용.
// 직접 Intl.DateTimeFormat 사용 금지.

function resolveLocale(locale: string): string {
  return LANGUAGE_LOCALE_MAP[locale] ?? locale;
}

export function formatDate(locale: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat(resolveLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return formatter.format(date);
}

export function formatTime(locale: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat(resolveLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
  });
  return formatter.format(date);
}

export function formatDateTime(locale: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat(resolveLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return formatter.format(date);
}

/**
 * 에디터 "최근 저장" 라벨 — 서버/클라이언트 동일 문자열 보장.
 * timezone 고정 (Asia/Seoul). locale 은 invitation/service locale.
 */
export function formatEditorSavedAtLabel(
  iso: string | null | undefined,
  localeInput: string = 'ko-KR'
): string {
  const locale = resolveInvitationLocale(localeInput);
  const language = languageFromLocale(locale);
  if (!iso) return translate(language, 'editor.saved.none');
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return translate(language, 'editor.saved.none');

  const formatted = new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  return `${translate(language, 'editor.saved.prefix')}: ${formatted}`;
}
