export const SUPPORTED_INVITATION_LOCALES = ['ko-KR', 'en-US'] as const;
export type InvitationLocale = (typeof SUPPORTED_INVITATION_LOCALES)[number];

export const DEFAULT_INVITATION_LOCALE: InvitationLocale = 'ko-KR';

const SUPPORTED = new Set<string>(SUPPORTED_INVITATION_LOCALES);

export function isSupportedInvitationLocale(value: string | null | undefined): value is InvitationLocale {
  return Boolean(value && SUPPORTED.has(value));
}

/**
 * Snapshot / legacy normalizer.
 * Missing, mn, or unknown → ko-KR (existing Korean-first inventory).
 */
export function normalizeInvitationLocale(value: string | null | undefined): InvitationLocale {
  const raw = (value || '').trim();
  if (isSupportedInvitationLocale(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower === 'en' || lower.startsWith('en-')) return 'en-US';
  if (lower === 'ko' || lower.startsWith('ko-')) return 'ko-KR';
  return DEFAULT_INVITATION_LOCALE;
}

export function withInvitationLocaleSnapshot(
  data: Record<string, unknown>,
  locale: InvitationLocale
): Record<string, unknown> {
  return {
    ...data,
    locale,
    language: locale,
  };
}
