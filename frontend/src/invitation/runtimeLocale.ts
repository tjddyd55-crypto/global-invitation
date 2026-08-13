/**
 * Runtime invitation locale fields injected by public/preview hosts.
 * Sparse wedding-like normalization must copy these or renderers fall back to ko-KR.
 */
export function copyRuntimeInvitationLocale<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>
): T {
  const language =
    typeof source.language === 'string' && source.language.trim() ? source.language.trim() : undefined;
  const locale =
    typeof source.locale === 'string' && source.locale.trim() ? source.locale.trim() : undefined;
  return {
    ...target,
    ...(locale ? { locale } : {}),
    ...(language ? { language } : {}),
  };
}
