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
