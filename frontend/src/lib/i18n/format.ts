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
 * locale·timezone 고정 (ko-KR / Asia/Seoul).
 */
export function formatEditorSavedAtLabel(iso: string | null | undefined): string {
  if (!iso) return '아직 저장되지 않음';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '아직 저장되지 않음';

  const formatted = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  return `최근 저장: ${formatted}`;
}
