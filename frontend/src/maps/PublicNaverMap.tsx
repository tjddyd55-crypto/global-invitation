'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef, useState } from 'react';
import { PUBLIC_MAP_HEIGHT_PX } from './config';
import type { InvitationMapSettings } from '@/src/invitation/mapSettings';
import {
  didNaverMapsAuthFail,
  hasNaverMapsClientId,
  loadNaverMaps,
  refreshNaverMapSize,
  waitForMapContainerSize,
  type NaverMapsMapInstance,
} from './loadNaverMaps';
import { buildNaverMapsViewUrl } from './naverMapsUrls';
import styles from './PublicNaverMap.module.css';

type PublicNaverMapProps = {
  settings: InvitationMapSettings;
  height?: number;
  /** Preview: disable pan/zoom gestures */
  interactive?: boolean;
  layoutPlaceholder?: boolean;
  /** QA surface: preview phone vs public page */
  surface?: 'preview' | 'public';
  className?: string;
};

type FallbackReason = 'client_id' | 'auth' | 'load' | 'coords' | 'layout';

function resolveFallbackMessage(reason: FallbackReason): string {
  if (reason === 'client_id') return '네이버 지도 설정이 필요합니다.';
  if (reason === 'coords') return '저장된 위치 정보가 없습니다.';
  if (reason === 'auth') return '네이버 지도 인증에 실패했습니다.';
  return '네이버 지도를 불러오지 못했습니다.';
}

function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!window.naver?.maps?.Service?.geocode) {
      resolve(null);
      return;
    }
    window.naver.maps.Service.geocode({ query }, (status, response) => {
      const ok = window.naver?.maps?.Service?.Status?.OK || 'OK';
      if (status !== ok) {
        resolve(null);
        return;
      }
      const payload = response as {
        v2?: { addresses?: Array<{ x?: string; y?: string }> };
      };
      const first = payload.v2?.addresses?.[0];
      const lat = Number(first?.y);
      const lng = Number(first?.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        resolve(null);
        return;
      }
      resolve({ lat, lng });
    });
  });
}

/**
 * Preview/Public shared Naver map canvas (real Maps JS API).
 * Do not render a static mint placeholder when Client ID + coords are available.
 */
export default function PublicNaverMap({
  settings,
  height = PUBLIC_MAP_HEIGHT_PX,
  interactive = true,
  layoutPlaceholder = false,
  surface = 'public',
  className,
}: PublicNaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMapsMapInstance | null>(null);
  const markerRef = useRef<{ setMap: (map: unknown | null) => void } | null>(null);
  const [fallbackReason, setFallbackReason] = useState<FallbackReason | null>(
    layoutPlaceholder ? 'layout' : null
  );
  const [ready, setReady] = useState(false);

  const mapTestId = surface === 'preview' ? 'preview-naver-map' : 'public-naver-map';
  const viewUrl = buildNaverMapsViewUrl(settings);
  const label = settings.formattedAddress || settings.venueName || '지도에서 보기';

  useEffect(() => {
    if (layoutPlaceholder) {
      setFallbackReason('layout');
      return;
    }
    if (!hasNaverMapsClientId()) {
      setFallbackReason('client_id');
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const cleanupMap = () => {
      try {
        markerRef.current?.setMap(null);
        mapInstanceRef.current?.destroy?.();
      } catch {
        // ignore
      }
      markerRef.current = null;
      mapInstanceRef.current = null;
    };

    const mount = async () => {
      setReady(false);
      setFallbackReason(null);
      try {
        await loadNaverMaps();
        if (cancelled || !mapRef.current || !window.naver?.maps) return;

        let lat = settings.latitude;
        let lng = settings.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          const query = settings.formattedAddress || settings.venueName;
          if (!query) {
            if (!cancelled) setFallbackReason('coords');
            return;
          }
          const geocoded = await geocodeAddress(query);
          if (!geocoded) {
            if (!cancelled) setFallbackReason('coords');
            return;
          }
          lat = geocoded.lat;
          lng = geocoded.lng;
        }

        await waitForMapContainerSize(mapRef.current);
        if (cancelled || !mapRef.current || !window.naver?.maps) return;

        cleanupMap();
        const maps = window.naver.maps;
        const center = new maps.LatLng(lat, lng);
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: 16,
          draggable: interactive,
          scrollWheel: interactive,
          pinchZoom: interactive,
          keyboardShortcuts: interactive,
          disableDoubleClickZoom: !interactive,
        });
        mapInstanceRef.current = map;
        markerRef.current = new maps.Marker({
          position: center,
          map,
          title: settings.venueName || settings.formattedAddress || undefined,
        });

        requestAnimationFrame(() => {
          refreshNaverMapSize(map, mapRef.current);
          map.setCenter(center);
          map.setZoom?.(16);
        });

        resizeObserver = new ResizeObserver(() => {
          refreshNaverMapSize(mapInstanceRef.current, mapRef.current);
        });
        resizeObserver.observe(mapRef.current);

        if (!cancelled) {
          setReady(true);
          setFallbackReason(null);
        }
      } catch (error) {
        if (cancelled) return;
        if (didNaverMapsAuthFail() || (error instanceof Error && error.message.includes('AUTH'))) {
          setFallbackReason('auth');
        } else if (error instanceof Error && error.message.includes('CLIENT_ID')) {
          setFallbackReason('client_id');
        } else {
          setFallbackReason('load');
        }
      }
    };

    void mount();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      cleanupMap();
    };
  }, [
    interactive,
    layoutPlaceholder,
    settings.formattedAddress,
    settings.latitude,
    settings.longitude,
    settings.venueName,
  ]);

  if (layoutPlaceholder) {
    return (
      <div
        className={`${styles.publicNaverMap} ${styles.placeholder} ${className || ''}`.trim()}
        style={{ height }}
        data-testid="map-provider-placeholder"
        data-qa-map-placeholder="1"
        aria-hidden
      />
    );
  }

  if (fallbackReason) {
    return (
      <a
        className={`${styles.publicNaverMap} ${styles.fallback} ${className || ''}`.trim()}
        style={{ height }}
        href={viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="map-provider-placeholder"
        data-qa-map-placeholder="1"
        data-fallback-reason={fallbackReason}
      >
        <span className={styles.fallbackInner}>
          <strong>{resolveFallbackMessage(fallbackReason)}</strong>
          <span>{label}</span>
        </span>
      </a>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`${styles.publicNaverMap} ${className || ''}`.trim()}
      style={{ height, minHeight: height }}
      data-testid={mapTestId}
      data-map-ready={ready ? '1' : '0'}
      data-map-interactive={interactive ? '1' : '0'}
      aria-label="네이버 지도"
    />
  );
}
