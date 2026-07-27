/**
 * Google Maps 브라우저 키 — 하드코딩 금지.
 */
export function getGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
}

export function getGoogleMapsMapId(): string | undefined {
  const id = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '').trim();
  return id || undefined;
}

export function hasGoogleMapsApiKey(): boolean {
  return getGoogleMapsApiKey().length > 0;
}

export const DEFAULT_MAP_ZOOM = 16;
export const EDITOR_MAP_HEIGHT_PX = 300;
export const PUBLIC_MAP_HEIGHT_PX = 280;
