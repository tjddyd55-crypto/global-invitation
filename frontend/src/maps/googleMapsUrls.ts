import type { InvitationLocation } from './types';
import { hasValidCoordinates } from './types';

function resolveQueryText(loc: InvitationLocation): string {
  const address = (loc.formattedAddress || '').trim();
  if (address) return address;
  const venue = (loc.venueName || '').trim();
  const combined = [venue, address].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  if (hasValidCoordinates(loc.latitude, loc.longitude)) {
    return `${loc.latitude},${loc.longitude}`;
  }
  return (loc.venueName || '').trim();
}

/**
 * Google Maps 외부 링크 SSOT.
 * 좌표는 URL fallback으로만 사용 — UI에는 노출하지 않음.
 */
export function buildGoogleMapsViewUrl(loc: InvitationLocation): string {
  const query = resolveQueryText(loc);
  const placeId = loc.googlePlaceId?.trim();
  if (placeId && query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${encodeURIComponent(placeId)}`;
  }
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=place&query_place_id=${encodeURIComponent(placeId)}`;
  }
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return 'https://www.google.com/maps';
}

export function buildGoogleMapsDirectionsUrl(loc: InvitationLocation): string {
  const destination = resolveQueryText(loc);
  const placeId = loc.googlePlaceId?.trim();
  if (placeId && destination) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&destination_place_id=${encodeURIComponent(placeId)}`;
  }
  if (placeId) {
    return `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(placeId)}`;
  }
  if (destination) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  }
  return 'https://www.google.com/maps/dir/?api=1';
}

/** Maps Embed API place mode query — placeId → coords → address */
export function buildEmbedPlaceQuery(loc: InvitationLocation): string {
  if (loc.googlePlaceId?.trim()) {
    return `place_id:${loc.googlePlaceId.trim()}`;
  }
  if (hasValidCoordinates(loc.latitude, loc.longitude)) {
    return `${loc.latitude},${loc.longitude}`;
  }
  return (loc.formattedAddress || loc.venueName || '').trim();
}
