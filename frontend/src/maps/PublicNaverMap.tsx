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
  interactive?: boolean;
  layoutPlaceholder?: boolean;
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
    let settled = false;
    const finish = (value: { lat: number; lng: number } | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), 8000);
    window.naver.maps.Service.geocode({ query }, (status, response) => {
      const ok = window.naver?.maps?.Service?.Status?.OK || 'OK';
      if (status !== ok) {
        finish(null);
        return;
      }
      const payload = response as {
        v2?: { addresses?: Array<{ x?: string; y?: string }> };
      };
      const first = payload.v2?.addresses?.[0];
      const lat = Number(first?.y);
      const lng = Number(first?.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        finish(null);
        return;
      }
      finish({ lat, lng });
    });
  });
}

function applyInteractionOptions(map: NaverMapsMapInstance, interactive: boolean): void {
  try {
    map.setOptions?.({
      draggable: interactive,
      scrollWheel: interactive,
      pinchZoom: interactive,
      keyboardShortcuts: interactive,
      disableDoubleClickZoom: !interactive,
    });
  } catch {
    // ignore unsupported option keys
  }
}

/**
 * Preview/Public shared Naver map canvas (real Maps JS API).
 * Outer shell holds React attributes; inner host is owned by Naver Maps DOM.
 */
export default function PublicNaverMap({
  settings,
  height = PUBLIC_MAP_HEIGHT_PX,
  interactive = true,
  layoutPlaceholder = false,
  surface = 'public',
  className,
}: PublicNaverMapProps) {
  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMapsMapInstance | null>(null);
  const markerRef = useRef<{ setMap: (map: unknown | null) => void } | null>(null);
  const [fallbackReason, setFallbackReason] = useState<FallbackReason | null>(
    layoutPlaceholder ? 'layout' : null
  );
  const [ready, setReady] = useState(false);

  const mapTestId = surface === 'preview' ? 'preview-naver-map' : 'public-naver-map';
  const viewUrl = buildNaverMapsViewUrl(settings);
  const label = settings.formattedAddress || settings.venueName || '지도에서 보기';
  const centerKey =
    typeof settings.latitude === 'number' && typeof settings.longitude === 'number'
      ? `${settings.latitude.toFixed(6)},${settings.longitude.toFixed(6)}`
      : `addr:${settings.formattedAddress || settings.venueName || ''}`;

  useEffect(() => {
    if (layoutPlaceholder) {
      setFallbackReason('layout');
      setReady(false);
      return;
    }
    if (!hasNaverMapsClientId()) {
      setFallbackReason('client_id');
      setReady(false);
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    const readyTimers: number[] = [];

    const cleanupMap = () => {
      try {
        markerRef.current?.setMap(null);
        mapInstanceRef.current?.destroy?.();
      } catch {
        // ignore
      }
      markerRef.current = null;
      mapInstanceRef.current = null;
      if (mapHostRef.current) {
        mapHostRef.current.innerHTML = '';
      }
    };

    const mount = async () => {
      setReady(false);
      setFallbackReason(null);
      try {
        await loadNaverMaps();
        if (cancelled || !mapHostRef.current || !window.naver?.maps) return;

        let lat = settings.latitude;
        let lng = settings.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          const query = settings.formattedAddress || settings.venueName;
          if (!query) {
            if (!cancelled) setFallbackReason('coords');
            return;
          }
          const geocoded = await geocodeAddress(query);
          if (cancelled) return;
          if (!geocoded) {
            setFallbackReason('coords');
            return;
          }
          lat = geocoded.lat;
          lng = geocoded.lng;
        }

        await waitForMapContainerSize(mapHostRef.current);
        if (cancelled || !mapHostRef.current || !window.naver?.maps) return;

        if (mapHostRef.current.clientWidth <= 0 || mapHostRef.current.clientHeight <= 0) {
          mapHostRef.current.style.width = '100%';
          mapHostRef.current.style.height = `${height}px`;
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }

        cleanupMap();

        const maps = window.naver.maps;
        const center = new maps.LatLng(lat, lng);
        const map = new maps.Map(mapHostRef.current, {
          center,
          zoom: 16,
        });
        mapInstanceRef.current = map;
        applyInteractionOptions(map, interactive);
        markerRef.current = new maps.Marker({
          position: center,
          map,
          title: settings.venueName || settings.formattedAddress || undefined,
        });

        const markReady = () => {
          if (cancelled) return;
          refreshNaverMapSize(map, mapHostRef.current);
          map.setCenter(center);
          map.setZoom?.(16);
          setReady(true);
          setFallbackReason(null);
        };

        markReady();
        readyTimers.push(window.setTimeout(markReady, 0));
        readyTimers.push(window.setTimeout(markReady, 200));
        readyTimers.push(window.setTimeout(markReady, 600));

        if (maps.Event?.addListener) {
          maps.Event.addListener(map, 'init', markReady);
          maps.Event.addListener(map, 'idle', markReady);
        }

        resizeObserver = new ResizeObserver(() => {
          refreshNaverMapSize(mapInstanceRef.current, mapHostRef.current);
        });
        resizeObserver.observe(mapHostRef.current);

        intersectionObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              markReady();
            }
          },
          { threshold: 0.05 }
        );
        intersectionObserver.observe(mapHostRef.current);
      } catch (error) {
        if (cancelled) return;
        if (didNaverMapsAuthFail() || (error instanceof Error && error.message.includes('AUTH'))) {
          setFallbackReason('auth');
        } else if (error instanceof Error && error.message.includes('CLIENT_ID')) {
          setFallbackReason('client_id');
        } else {
          setFallbackReason('load');
        }
        setReady(false);
      }
    };

    void mount();

    return () => {
      cancelled = true;
      readyTimers.forEach((timer) => window.clearTimeout(timer));
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      cleanupMap();
    };
  }, [
    centerKey,
    height,
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
      className={`${styles.publicNaverMap} ${className || ''}`.trim()}
      style={{ height, minHeight: height }}
      data-testid={mapTestId}
      data-map-ready={ready ? '1' : '0'}
      data-map-interactive={interactive ? '1' : '0'}
      aria-label="네이버 지도"
    >
      <div ref={mapHostRef} className={styles.mapHost} />
    </div>
  );
}
