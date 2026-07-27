'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef } from 'react';
import { DEFAULT_MAP_ZOOM, EDITOR_MAP_HEIGHT_PX, getGoogleMapsMapId } from './config';
import { useGoogleMaps } from './GoogleMapsProvider';
import type { PendingInvitationLocation } from './types';
import styles from './LocationPickerMap.module.css';

type LocationPickerMapProps = {
  location: PendingInvitationLocation | null;
  height?: number;
};

export default function LocationPickerMap({
  location,
  height = EDITOR_MAP_HEIGHT_PX,
}: LocationPickerMapProps) {
  const { ready, maps, loading, error } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!ready || !maps || !containerRef.current) return;
    if (mapRef.current) return;

    const mapId = getGoogleMapsMapId();
    mapRef.current = new maps.Map(containerRef.current, {
      center: { lat: 37.5665, lng: 126.978 },
      zoom: DEFAULT_MAP_ZOOM,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      ...(mapId ? { mapId } : {}),
    });
  }, [ready, maps]);

  useEffect(() => {
    if (!ready || !maps || !mapRef.current || !location) return;
    const lat = location.latitude;
    const lng = location.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const position: google.maps.LatLngLiteral = { lat, lng };

    if (location.viewport) {
      mapRef.current.fitBounds(location.viewport);
    } else {
      mapRef.current.setCenter(position);
      mapRef.current.setZoom(DEFAULT_MAP_ZOOM);
    }

    if (!markerRef.current) {
      markerRef.current = new maps.Marker({
        map: mapRef.current,
        position,
        title: location.venueName || location.formattedAddress,
        draggable: false,
      });
    } else {
      markerRef.current.setPosition(position);
      markerRef.current.setMap(mapRef.current);
    }
  }, [ready, maps, location]);

  if (error) {
    return (
      <div className={styles.fallback} style={{ height }} data-testid="location-picker-map-error">
        지도를 불러오지 못했습니다. 주소 텍스트는 저장할 수 있습니다.
      </div>
    );
  }

  if (loading || !ready) {
    return (
      <div className={styles.fallback} style={{ height }} data-testid="location-picker-map-loading">
        지도 로딩 중…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.map}
      style={{ height }}
      data-testid="location-picker-map"
      aria-label="선택한 위치 지도"
    />
  );
}
