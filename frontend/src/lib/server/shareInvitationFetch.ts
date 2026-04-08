/**
 * Edge·Node 공통 공유 초대장 API fetch (server-only 아님 — opengraph edge 호환).
 */
function resolveShareApiBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  const fromServer = process.env.API_BASE_URL || process.env.BACKEND_URL;
  const candidate = fromPublic || fromServer || 'http://127.0.0.1:3001';
  return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
}

export type SharedInvitationApiPayload = {
  title?: string | null;
  message?: string | null;
  eventDate?: string | null;
  locationText?: string | null;
  conceptType?: string | null;
  templateKey?: string | null;
  data?: unknown;
  dataJson?: unknown;
};

export async function requestSharedInvitation(
  shareSlug: string,
  cacheMode: 'revalidate120' | 'noStore'
): Promise<SharedInvitationApiPayload | null> {
  const slug = shareSlug.trim();
  if (!slug) return null;
  try {
    const base = resolveShareApiBaseUrl();
    const init: RequestInit =
      cacheMode === 'noStore'
        ? { cache: 'no-store' }
        : { next: { revalidate: 120 } };
    const response = await fetch(`${base}/api/invitations/share/${encodeURIComponent(slug)}`, init);
    if (!response.ok) return null;
    return (await response.json()) as SharedInvitationApiPayload;
  } catch {
    return null;
  }
}

/** Edge OG 이미지 전용 래퍼 */
export function fetchSharedInvitationForOpenGraph(shareSlug: string): Promise<SharedInvitationApiPayload | null> {
  return requestSharedInvitation(shareSlug, 'noStore');
}
