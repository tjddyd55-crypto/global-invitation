'use client';
/* eslint-disable i18next/no-literal-string */

import { useRef, useState } from 'react';
import { hasNaverMapsClientId } from './loadNaverMaps';
import NaverPlaceSearch, { type NaverGeocodeItem } from './NaverPlaceSearch';
import NaverLocationPickerMap, {
  type NaverLocationPickerMapHandle,
} from './NaverLocationPickerMap';
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

/**
 * Naver place/address search + marker confirm.
 * Client ID 없으면 fallback UI.
 */
export default function NaverLocationPicker({
  initialQuery = '',
  confirmed,
  onConfirm,
}: NaverLocationPickerProps) {
  const mapHandleRef = useRef<NaverLocationPickerMapHandle | null>(null);

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState<NaverGeocodeItem[]>([]);
  const [pending, setPending] = useState<NaverPendingLocation | null>(null);

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
        .filter((item): item is NaverGeocodeItem => Boolean(item));
      setResults(items);
      if (items.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    });
  };

  const selectResult = (item: NaverGeocodeItem) => {
    mapHandleRef.current?.moveMarker(item.lat, item.lng);
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
      <NaverPlaceSearch
        query={query}
        loading={loading}
        error={error}
        results={results}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        onSelect={selectResult}
      />

      <NaverLocationPickerMap
        ref={mapHandleRef}
        latitude={confirmed?.latitude}
        longitude={confirmed?.longitude}
        onReadyChange={setReady}
        onLoadingChange={setLoading}
        onError={(message) => setError(message || null)}
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
