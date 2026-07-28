/**
 * Map provider SSOT — Editor / Preview / Public 공통.
 */

export type InvitationMapProvider = 'GOOGLE' | 'NAVER';

export type InvitationMapSettings = {
  provider: InvitationMapProvider;
  venueName: string;
  formattedAddress: string;
  detailAddress?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  naverPlaceId?: string;
  naverMapUrl?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function readString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

function readNumber(...candidates: unknown[]): number | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function resolveProvider(data: Record<string, unknown>): InvitationMapProvider {
  const nested = isRecord(data.location) ? data.location : null;
  const raw = readString(nested?.mapProvider, data.mapProvider).toUpperCase();
  if (raw === 'NAVER') return 'NAVER';
  if (raw === 'GOOGLE') return 'GOOGLE';
  // Legacy: googlePlaceId 또는 좌표/주소만 있으면 GOOGLE
  return 'GOOGLE';
}

/**
 * dataJson / editor location → 단일 지도 설정.
 * provider 없으면 GOOGLE fallback.
 */
export function getInvitationMapSettings(data: unknown): InvitationMapSettings {
  if (!isRecord(data)) {
    return {
      provider: 'GOOGLE',
      venueName: '',
      formattedAddress: '',
    };
  }

  const nested = isRecord(data.location) ? data.location : null;
  const venueName = readString(
    nested?.venueName,
    data.venueName,
    data.locationText,
    data.heroTitle,
    data.title
  );
  const formattedAddress = readString(
    nested?.formattedAddress,
    nested?.address,
    data.formattedAddress,
    data.address
  );
  const detailAddress =
    readString(nested?.detailAddress, data.detailAddress, data.venueDetail) || undefined;

  return {
    provider: resolveProvider(data),
    venueName,
    formattedAddress,
    detailAddress,
    latitude: readNumber(nested?.latitude, nested?.mapLat, data.mapLat),
    longitude: readNumber(nested?.longitude, nested?.mapLng, data.mapLng),
    googlePlaceId: readString(nested?.googlePlaceId, data.googlePlaceId) || undefined,
    naverPlaceId: readString(nested?.naverPlaceId, data.naverPlaceId) || undefined,
    naverMapUrl: readString(nested?.naverMapUrl, data.naverMapUrl) || undefined,
  };
}

export function hasMapTarget(settings: InvitationMapSettings): boolean {
  return Boolean(
    settings.googlePlaceId ||
      settings.naverPlaceId ||
      settings.naverMapUrl ||
      (typeof settings.latitude === 'number' && typeof settings.longitude === 'number') ||
      settings.formattedAddress ||
      settings.venueName
  );
}
