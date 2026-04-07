/**
 * 공식 공개 초대장 경로 (/i/{shareSlug})
 */
export function buildPublicInvitationUrlPath(shareSlug: string): string {
  const trimmed = shareSlug.trim();
  if (!trimmed) return '/i';
  return `/i/${encodeURIComponent(trimmed)}`;
}

export function buildAbsolutePublicInvitationUrl(origin: string, shareSlug: string): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}${buildPublicInvitationUrlPath(shareSlug)}`;
}
