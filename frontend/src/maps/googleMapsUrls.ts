import type { InvitationLocation } from './types';
import { hasValidCoordinates } from './types';

export function buildGoogleMapsViewUrl(loc: InvitationLocation): string {
  if (loc.googlePlaceId?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(loc.googlePlaceId.trim())}`;
  }
  if (hasValidCoordinates(loc.latitude, loc.longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }
  const q = (loc.formattedAddress || loc.venueName || '').trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || '대한민국')}`;
}

export function buildGoogleMapsDirectionsUrl(loc: InvitationLocation): string {
  if (loc.googlePlaceId?.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(loc.googlePlaceId.trim())}`;
  }
  if (hasValidCoordinates(loc.latitude, loc.longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
  }
  const q = (loc.formattedAddress || loc.venueName || '').trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q || '대한민국')}`;
}

/** Maps Embed API place mode query */
export function buildEmbedPlaceQuery(loc: InvitationLocation): string {
  if (loc.googlePlaceId?.trim()) {
    return `place_id:${loc.googlePlaceId.trim()}`;
  }
  if (hasValidCoordinates(loc.latitude, loc.longitude)) {
    return `${loc.latitude},${loc.longitude}`;
  }
  return (loc.formattedAddress || loc.venueName || '').trim();
}
