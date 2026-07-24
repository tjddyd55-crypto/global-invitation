/**
 * 공식 공개 초대장 경로 (/i/{shareSlug})
 */
export function buildPublicInvitationUrlPath(shareSlug?: string | null): string {
  const trimmed = typeof shareSlug === 'string' ? shareSlug.trim() : '';
  if (!trimmed) return '/i';
  return `/i/${encodeURIComponent(trimmed)}`;
}

function isLocalDevHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  );
}

/**
 * 공유용 절대 URL: 로컬이 아닌 호스트는 https로 통일(카카오/OG 스크랩 안정화).
 */
export function normalizePublicOriginForShare(origin: string): string {
  const raw = origin.replace(/\/+$/, '').trim();
  if (!raw) return raw;
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
    if (isLocalDevHost(u.hostname)) {
      return `${u.protocol}//${u.host}`;
    }
    if (u.protocol === 'http:') {
      u.protocol = 'https:';
    }
    return u.origin;
  } catch {
    return raw;
  }
}

export function buildAbsolutePublicInvitationUrl(origin: string, shareSlug: string): string {
  const base = normalizePublicOriginForShare(origin);
  return `${base}${buildPublicInvitationUrlPath(shareSlug)}`;
}
