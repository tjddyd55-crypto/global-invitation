/**
 * Naver Maps deep links SSOT.
 * 좌표는 URL fallback 전용 — UI 미노출.
 */

import type { InvitationMapSettings } from '@/src/invitation/mapSettings';
import { hasValidCoordinates } from './types';

function resolveQuery(settings: InvitationMapSettings): string {
  const address = (settings.formattedAddress || '').trim();
  if (address) return address;
  return (settings.venueName || '').trim();
}

export function buildNaverMapsViewUrl(settings: InvitationMapSettings): string {
  if (settings.naverMapUrl?.trim()) {
    return settings.naverMapUrl.trim();
  }
  if (settings.naverPlaceId?.trim()) {
    return `https://map.naver.com/v5/entry/place/${encodeURIComponent(settings.naverPlaceId.trim())}`;
  }
  if (hasValidCoordinates(settings.latitude, settings.longitude)) {
    return `https://map.naver.com/v5/search/${encodeURIComponent(
      resolveQuery(settings) || `${settings.latitude},${settings.longitude}`
    )}?c=${settings.longitude},${settings.latitude},16,0,0,0,dh`;
  }
  const query = resolveQuery(settings);
  if (query) {
    return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`;
  }
  return 'https://map.naver.com';
}

export function buildNaverMapsDirectionsUrl(settings: InvitationMapSettings): string {
  if (hasValidCoordinates(settings.latitude, settings.longitude)) {
    const name = encodeURIComponent(resolveQuery(settings) || 'destination');
    return `https://map.naver.com/v5/directions/-/-/${settings.longitude},${settings.latitude},${name}/-/car`;
  }
  const query = resolveQuery(settings);
  if (query) {
    return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`;
  }
  return 'https://map.naver.com';
}
