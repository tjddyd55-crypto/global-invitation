export const SUPPORTED_INVITATION_LOCALES = ['ko-KR', 'en-US'] as const;
export type InvitationLocale = (typeof SUPPORTED_INVITATION_LOCALES)[number];

export const DEFAULT_INVITATION_LOCALE: InvitationLocale = 'ko-KR';

const SUPPORTED = new Set<string>(SUPPORTED_INVITATION_LOCALES);

export function isSupportedInvitationLocale(value: string | null | undefined): value is InvitationLocale {
  return Boolean(value && SUPPORTED.has(value));
}

/**
 * Read-time legacy normalizer.
 * Existing rows may be `ko` / `en` / `mn` / missing.
 * Unknown → ko-KR. Do not use this to silently accept garbage on new writes.
 */
export function normalizeInvitationLocale(value: string | null | undefined): InvitationLocale {
  const raw = (value || '').trim();
  if (isSupportedInvitationLocale(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower === 'en' || lower.startsWith('en-')) return 'en-US';
  if (lower === 'ko' || lower === 'kr' || lower.startsWith('ko-')) return 'ko-KR';
  return DEFAULT_INVITATION_LOCALE;
}

export type ParseCreateLocaleResult =
  | { ok: true; locale: InvitationLocale; omitted: boolean }
  | { ok: false; error: 'INVALID_LOCALE' };

/**
 * New create writes: ko-KR | en-US, or legacy ko/en/kr.
 * Omitted → ko-KR (compatibility). Arbitrary strings → INVALID_LOCALE.
 */
export function parseCreateInvitationLocale(raw: string | null | undefined): ParseCreateLocaleResult {
  const value = (raw || '').trim();
  if (!value) return { ok: true, locale: DEFAULT_INVITATION_LOCALE, omitted: true };
  if (isSupportedInvitationLocale(value)) return { ok: true, locale: value, omitted: false };
  const lower = value.toLowerCase();
  if (lower === 'en' || lower.startsWith('en-')) return { ok: true, locale: 'en-US', omitted: false };
  if (lower === 'ko' || lower === 'kr' || lower.startsWith('ko-')) return { ok: true, locale: 'ko-KR', omitted: false };
  return { ok: false, error: 'INVALID_LOCALE' };
}

export function stripLegacyDataJsonLocale(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };
  delete next.locale;
  const language = next.language;
  if (
    typeof language === 'string' &&
    (language === 'ko-KR' ||
      language === 'en-US' ||
      language === 'ko' ||
      language === 'en' ||
      language === 'mn')
  ) {
    delete next.language;
  }
  return next;
}

export function readLegacyDataJsonLocale(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const locale = (data as { locale?: unknown }).locale;
  if (typeof locale === 'string' && locale.trim()) return locale;
  const language = (data as { language?: unknown }).language;
  if (typeof language === 'string' && language.trim()) return language;
  return undefined;
}

/**
 * Canonical invitation locale: Invitation.language wins over legacy dataJson.locale.
 */
export function resolveStoredInvitationLocale(params: {
  language?: string | null;
  dataJson?: unknown;
  data?: unknown;
}): InvitationLocale {
  if (params.language && params.language.trim()) {
    return normalizeInvitationLocale(params.language);
  }
  return normalizeInvitationLocale(readLegacyDataJsonLocale(params.dataJson ?? params.data));
}
