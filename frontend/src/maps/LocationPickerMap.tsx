'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef } from 'react';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import { DEFAULT_MAP_ZOOM, EDITOR_MAP_HEIGHT_PX, getGoogleMapsMapId } from './config';
import { useGoogleMaps } from './GoogleMapsProvider';
import type { PendingInvitationLocation } from './types';
import { hasValidCoordinates } from './types';
import styles from './LocationPickerMap.module.css';

type LocationPickerMapProps = {
  location: PendingInvitationLocation | null;
  height?: number;
};

type MarkerKind = 'advanced' | 'classic';

type AnyMarker = google.maps.Marker | google.maps.marker.AdvancedMarkerElement;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildInfoContent(location: PendingInvitationLocation): string {
  const name = (location.venueName || '').trim();
  const address = (location.formattedAddress || '').trim();
  const detail = (location.detailAddress || '').trim();
  const lines = [
    name ? `<div style="font-weight:700;margin-bottom:4px">${escapeHtml(name)}</div>` : '',
    address ? `<div style="font-size:12px;line-height:1.4">${escapeHtml(address)}</div>` : '',
    detail ? `<div style="font-size:12px;line-height:1.4;margin-top:2px">${escapeHtml(detail)}</div>` : '',
  ].filter(Boolean);
  return `<div style="max-width:220px;padding:2px 0;color:#111">${lines.join('')}</div>`;
}

function clearMarker(marker: AnyMarker | null): void {
  if (!marker) return;
  if ('setMap' in marker && typeof marker.setMap === 'function') {
    marker.setMap(null);
    return;
  }
  (marker as google.maps.marker.AdvancedMarkerElement).map = null;
}

function supportsAdvancedMarker(maps: typeof google.maps, mapId?: string): boolean {
  return Boolean(mapId && maps.marker?.AdvancedMarkerElement);
}

/**
 * Editor map — selected place always shows exactly one marker.
 * Map ID는 선택값. Advanced Marker 불가 시 classic Marker (mapId 없이) fallback.
 */
export default function LocationPickerMap({
  location,
  height = EDITOR_MAP_HEIGHT_PX,
}: LocationPickerMapProps) {
  const { t } = useInvitationT();
  const { ready, maps, loading, error } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<AnyMarker | null>(null);
  const markerKindRef = useRef<MarkerKind | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!ready || !maps || !containerRef.current) return;
    if (mapRef.current) return;

    const mapId = getGoogleMapsMapId();
    const useAdvanced = supportsAdvancedMarker(maps, mapId);

    mapRef.current = new maps.Map(containerRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      ...(useAdvanced && mapId ? { mapId } : {}),
    });
  }, [ready, maps]);

  useEffect(() => {
    if (!ready || !maps || !mapRef.current) return;

    const hasValidPosition = hasValidCoordinates(location?.latitude, location?.longitude);
    if (!location || !hasValidPosition) {
      clearMarker(markerRef.current);
      markerRef.current = null;
      markerKindRef.current = null;
      infoRef.current?.close();
      return;
    }

    const position: google.maps.LatLngLiteral = {
      lat: location.latitude as number,
      lng: location.longitude as number,
    };
    const title = location.venueName || location.formattedAddress || 'Selected place';

    mapRef.current.setCenter(position);
    mapRef.current.setZoom(DEFAULT_MAP_ZOOM);

    const mapId = getGoogleMapsMapId();
    const preferAdvanced = supportsAdvancedMarker(maps, mapId);

    const ensureClassicMarker = () => {
      if (markerKindRef.current === 'classic' && markerRef.current) {
        const classic = markerRef.current as google.maps.Marker;
        classic.setPosition(position);
        classic.setTitle(title);
        classic.setMap(mapRef.current);
        classic.setAnimation(maps.Animation.DROP);
        return;
      }
      clearMarker(markerRef.current);
      markerRef.current = new maps.Marker({
        map: mapRef.current,
        position,
        title,
        draggable: false,
        animation: maps.Animation.DROP,
      });
      markerKindRef.current = 'classic';
    };

    try {
      if (preferAdvanced) {
        if (markerKindRef.current === 'advanced' && markerRef.current) {
          const advanced = markerRef.current as google.maps.marker.AdvancedMarkerElement;
          advanced.position = position;
          advanced.title = title;
          advanced.map = mapRef.current;
        } else {
          clearMarker(markerRef.current);
          markerRef.current = new maps.marker.AdvancedMarkerElement({
            map: mapRef.current,
            position,
            title,
          });
          markerKindRef.current = 'advanced';
        }
      } else {
        ensureClassicMarker();
      }
    } catch (err) {
      console.warn('[LocationPickerMap] marker create failed; classic fallback', err);
      ensureClassicMarker();
    }

    if (!infoRef.current) {
      infoRef.current = new maps.InfoWindow({ maxWidth: 240 });
    }
    infoRef.current.setContent(buildInfoContent(location));

    const marker = markerRef.current;
    if (marker) {
      maps.event.clearInstanceListeners(marker);
      marker.addListener('click', () => {
        infoRef.current?.open({
          map: mapRef.current,
          anchor: marker as google.maps.Marker,
        });
      });
    }
  }, [ready, maps, location]);

  if (error) {
    return (
      <div className={styles.fallback} style={{ height }} data-testid="location-picker-map-error">
        {t('editor.map.loadFailed')}
      </div>
    );
  }

  if (loading || !ready) {
    return (
      <div className={styles.fallback} style={{ height }} data-testid="location-picker-map-loading">
        {t('editor.map.loading')}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.map}
      style={{ height }}
      data-testid="location-picker-map"
      data-has-marker={hasValidCoordinates(location?.latitude, location?.longitude) ? '1' : '0'}
      aria-label="선택한 위치 지도"
    />
  );
}
