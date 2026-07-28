'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef, useState } from 'react';
import { EDITOR_MAP_HEIGHT_PX } from './config';
import { loadNaverMaps, hasNaverMapsClientId, didNaverMapsAuthFail } from './loadNaverMaps';
import styles from './LocationPicker.module.css';

export type NaverPendingLocation = {
  venueName: string;
  formattedAddress: string;
  detailAddress?: string;
  latitude: number;
  longitude: number;
  naverPlaceId?: string;
  naverMapUrl?: string;
};

type NaverLocationPickerProps = {
  initialQuery?: string;
  confirmed?: {
    venueName?: string;
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  onConfirm: (value: NaverPendingLocation) => void;
};

type GeocodeItem = {
  title: string;
  address: string;
  lat: number;
  lng: number;
};

/**
 * Naver place/address search + marker confirm.
 * Client ID 없으면 fallback UI.
 */
export default function NaverLocationPicker({
  initialQuery = '',
  confirmed,
  onConfirm,
}: NaverLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ setCenter: (latlng: unknown) => void; destroy?: () => void } | null>(
    null
  );
  const markerRef = useRef<{ setMap: (map: unknown | null) => void } | null>(null);

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState<GeocodeItem[]>([]);
  const [pending, setPending] = useState<NaverPendingLocation | null>(null);

  useEffect(() => {
    if (!hasNaverMapsClientId()) {
      setError('Naver 지도 Client ID가 설정되지 않았습니다.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    loadNaverMaps()
      .then(() => {
        if (cancelled || !mapRef.current || !window.naver?.maps) return;
        const maps = window.naver.maps;
        const lat = confirmed?.latitude ?? 37.5665;
        const lng = confirmed?.longitude ?? 126.978;
        const center = new maps.LatLng(lat, lng);
        const map = new maps.Map(mapRef.current, { center, zoom: 16 });
        mapInstanceRef.current = map;
        const marker = new maps.Marker({ position: center, map });
        markerRef.current = marker;
        setReady(true);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (didNaverMapsAuthFail() || (err instanceof Error && err.message.includes('AUTH'))) {
          setError('Naver 지도 인증에 실패했습니다. 도메인/Client ID를 확인해 주세요.');
        } else {
          setError('선택한 지도 서비스를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
  }, [confirmed?.latitude, confirmed?.longitude]);

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

  const handleSearch = () => {
    const q = query.trim();
    if (!q) {
      setError('장소 또는 주소를 입력해 주세요.');
      return;
    }
    if (!window.naver?.maps?.Service?.geocode) {
      setError('Naver 검색 서비스를 사용할 수 없습니다.');
      return;
    }
    setError(null);
    setLoading(true);
    window.naver.maps.Service.geocode({ query: q }, (status, response) => {
      setLoading(false);
      const ok = window.naver?.maps?.Service?.Status?.OK || 'OK';
      if (status !== ok) {
        setResults([]);
        setError('검색 결과가 없습니다.');
        return;
      }
      const payload = response as {
        v2?: {
          addresses?: Array<{
            roadAddress?: string;
            jibunAddress?: string;
            x?: string;
            y?: string;
            addressElements?: Array<{ types?: string[]; longName?: string }>;
          }>;
        };
      };
      const items = (payload.v2?.addresses || [])
        .map((item) => {
          const lat = Number(item.y);
          const lng = Number(item.x);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const title =
            item.addressElements?.find((el) => el.types?.includes('BUILDING_NAME'))?.longName ||
            item.roadAddress ||
            item.jibunAddress ||
            q;
          return {
            title: title || q,
            address: item.roadAddress || item.jibunAddress || q,
            lat,
            lng,
          };
        })
        .filter((item): item is GeocodeItem => Boolean(item));
      setResults(items);
      if (items.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    });
  };

  const selectResult = (item: GeocodeItem) => {
    moveMarker(item.lat, item.lng);
    setPending({
      venueName: item.title,
      formattedAddress: item.address,
      latitude: item.lat,
      longitude: item.lng,
      naverMapUrl: `https://map.naver.com/v5/search/${encodeURIComponent(item.address)}`,
    });
  };

  if (!hasNaverMapsClientId()) {
    return (
      <div className={styles.fallback} data-testid="naver-map-fallback">
        <p>선택한 지도 서비스를 불러오지 못했습니다.</p>
        <p>주소는 저장되며 외부 지도에서 확인할 수 있습니다.</p>
        <p className={styles.hint}>NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID 를 development에 등록해 주세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.picker} data-testid="naver-location-picker">
      <div className={styles.searchRow}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="장소명 또는 주소 검색 (Naver)"
          data-testid="naver-place-search"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSearch();
            }
          }}
        />
        <button type="button" onClick={handleSearch} disabled={loading}>
          검색
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {results.length > 0 ? (
        <ul className={styles.results} data-testid="naver-search-results">
          {results.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.address}`}>
              <button type="button" onClick={() => selectResult(item)}>
                <strong>{item.title}</strong>
                <span>{item.address}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        ref={mapRef}
        className={styles.mapCanvas}
        style={{ height: EDITOR_MAP_HEIGHT_PX }}
        data-testid="naver-editor-map"
      />

      {!ready && loading ? <p className={styles.hint}>지도를 불러오는 중…</p> : null}

      {pending ? (
        <div className={styles.confirmCard} data-testid="naver-confirm-card">
          <div>
            <strong>{pending.venueName}</strong>
            <p>{pending.formattedAddress}</p>
          </div>
          <button type="button" onClick={() => onConfirm(pending)}>
            이 위치로 확정
          </button>
        </div>
      ) : null}
    </div>
  );
}
