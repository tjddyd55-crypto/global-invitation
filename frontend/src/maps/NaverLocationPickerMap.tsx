'use client';
/* eslint-disable i18next/no-literal-string */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EDITOR_MAP_HEIGHT_PX } from './config';
import {
  loadNaverMaps,
  hasNaverMapsClientId,
  didNaverMapsAuthFail,
  type NaverMapsMapInstance,
} from './loadNaverMaps';
import styles from './LocationPicker.module.css';

export type NaverLocationPickerMapHandle = {
  moveMarker: (lat: number, lng: number) => void;
};

type NaverLocationPickerMapProps = {
  latitude?: number;
  longitude?: number;
  onReadyChange?: (ready: boolean) => void;
  onError?: (message: string) => void;
  onLoadingChange?: (loading: boolean) => void;
};

/**
 * Editor Naver map canvas + marker lifecycle.
 */
const NaverLocationPickerMap = forwardRef<NaverLocationPickerMapHandle, NaverLocationPickerMapProps>(
  function NaverLocationPickerMap(
    { latitude, longitude, onReadyChange, onError, onLoadingChange },
    ref
  ) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<NaverMapsMapInstance | null>(null);
    const markerRef = useRef<{ setMap: (map: unknown | null) => void } | null>(null);
    const onReadyChangeRef = useRef(onReadyChange);
    const onErrorRef = useRef(onError);
    const onLoadingChangeRef = useRef(onLoadingChange);
    onReadyChangeRef.current = onReadyChange;
    onErrorRef.current = onError;
    onLoadingChangeRef.current = onLoadingChange;

    const moveMarker = (lat: number, lng: number) => {
      if (!window.naver?.maps || !mapInstanceRef.current) return;
      const maps = window.naver.maps;
      const position = new maps.LatLng(lat, lng);
      mapInstanceRef.current.setCenter(position);
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = new maps.Marker({ position, map: mapInstanceRef.current });
    };

    useImperativeHandle(ref, () => ({ moveMarker }), []);

    useEffect(() => {
      if (!hasNaverMapsClientId()) {
        onErrorRef.current?.('Naver 지도 Client ID가 설정되지 않았습니다.');
        return;
      }

      let cancelled = false;
      onLoadingChangeRef.current?.(true);
      loadNaverMaps()
        .then(() => {
          if (cancelled || !mapRef.current || !window.naver?.maps) return;
          const maps = window.naver.maps;
          const lat = latitude ?? 37.5665;
          const lng = longitude ?? 126.978;
          const center = new maps.LatLng(lat, lng);
          const map = new maps.Map(mapRef.current, { center, zoom: 16 });
          mapInstanceRef.current = map;
          const marker = new maps.Marker({ position: center, map });
          markerRef.current = marker;
          onReadyChangeRef.current?.(true);
        })
        .catch((err) => {
          if (cancelled) return;
          onReadyChangeRef.current?.(false);
          if (didNaverMapsAuthFail() || (err instanceof Error && err.message.includes('AUTH'))) {
            onErrorRef.current?.('Naver 지도 인증에 실패했습니다. 도메인/Client ID를 확인해 주세요.');
          } else {
            onErrorRef.current?.('선택한 지도 서비스를 불러오지 못했습니다.');
          }
        })
        .finally(() => {
          if (!cancelled) onLoadingChangeRef.current?.(false);
        });

      return () => {
        cancelled = true;
        try {
          markerRef.current?.setMap(null);
          mapInstanceRef.current?.destroy?.();
        } catch {
          // ignore cleanup errors
        }
        markerRef.current = null;
        mapInstanceRef.current = null;
      };
    }, [latitude, longitude]);

    return (
      <div
        ref={mapRef}
        className={styles.mapCanvas}
        style={{ height: EDITOR_MAP_HEIGHT_PX }}
        data-testid="editor-naver-map"
      />
    );
  }
);

export default NaverLocationPickerMap;
