/**
 * Invitation location SSOT — Editor / Public 공통.
 * 좌표·placeId는 내부 전용 (사용자 UI 미노출).
 */
export type InvitationLocation = {
  venueName: string;
  formattedAddress: string;
  detailAddress?: string;
  googlePlaceId?: string;
  latitude?: number;
  longitude?: number;
};

export type PendingInvitationLocation = InvitationLocation & {
  viewport?: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
};

export function hasValidCoordinates(
  lat?: number | null,
  lng?: number | null
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

export function locationDisplayAddress(loc: Pick<InvitationLocation, 'formattedAddress' | 'detailAddress'>): string {
  const base = (loc.formattedAddress || '').trim();
  const detail = (loc.detailAddress || '').trim();
  if (!detail) return base;
  if (!base) return detail;
  return `${base} ${detail}`.trim();
}
