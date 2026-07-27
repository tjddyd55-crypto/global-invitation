'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useMemo, useState } from 'react';
import GoogleMapsExternalLinks from './GoogleMapsExternalLinks';
import { GoogleMapsProvider, useGoogleMaps } from './GoogleMapsProvider';
import LocationConfirmationCard from './LocationConfirmationCard';
import LocationPickerMap from './LocationPickerMap';
import PlaceSearchInput from './PlaceSearchInput';
import type { InvitationLocation, PendingInvitationLocation } from './types';
import { hasValidCoordinates } from './types';
import styles from './LocationPicker.module.css';

export type LocationPickerValue = InvitationLocation;

type LocationPickerProps = {
  value: LocationPickerValue;
  onConfirm: (next: LocationPickerValue) => void;
  /** 주소만 텍스트 fallback (API key 없을 때) */
  onAddressFallbackChange?: (address: string) => void;
};

function placeToPending(place: google.maps.places.PlaceResult, venueNameFallback: string): PendingInvitationLocation | null {
  const location = place.geometry?.location;
  if (!location) return null;
  const lat = location.lat();
  const lng = location.lng();
  const bounds = place.geometry?.viewport;
  const resolvedViewport = bounds
    ? {
        south: bounds.getSouthWest().lat(),
        west: bounds.getSouthWest().lng(),
        north: bounds.getNorthEast().lat(),
        east: bounds.getNorthEast().lng(),
      }
    : undefined;

  return {
    venueName: (place.name || venueNameFallback || '').trim(),
    formattedAddress: (place.formatted_address || '').trim(),
    googlePlaceId: place.place_id,
    latitude: lat,
    longitude: lng,
    viewport: resolvedViewport,
  };
}

function LocationPickerInner({ value, onConfirm, onAddressFallbackChange }: LocationPickerProps) {
  const { hasApiKey, error: mapsError, loading } = useGoogleMaps();
  const [venueName, setVenueName] = useState(value.venueName || '');
  const [detailAddress, setDetailAddress] = useState(value.detailAddress || '');
  const [searchText, setSearchText] = useState(value.formattedAddress || '');
  const [pending, setPending] = useState<PendingInvitationLocation | null>(() =>
    hasValidCoordinates(value.latitude, value.longitude)
      ? {
          venueName: value.venueName,
          formattedAddress: value.formattedAddress,
          detailAddress: value.detailAddress,
          googlePlaceId: value.googlePlaceId,
          latitude: value.latitude,
          longitude: value.longitude,
        }
      : null
  );
  const [confirmed, setConfirmed] = useState(() =>
    Boolean(value.formattedAddress?.trim() && hasValidCoordinates(value.latitude, value.longitude))
  );
  const [needsPlaceSelection, setNeedsPlaceSelection] = useState(false);

  const preview = useMemo<PendingInvitationLocation | null>(() => {
    if (pending) {
      return {
        ...pending,
        venueName: venueName.trim() || pending.venueName,
        detailAddress: detailAddress.trim() || undefined,
      };
    }
    if (hasValidCoordinates(value.latitude, value.longitude)) {
      return {
        venueName: venueName.trim() || value.venueName,
        formattedAddress: value.formattedAddress,
        detailAddress: detailAddress.trim() || value.detailAddress,
        googlePlaceId: value.googlePlaceId,
        latitude: value.latitude,
        longitude: value.longitude,
      };
    }
    return null;
  }, [pending, venueName, detailAddress, value]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    setConfirmed(false);
    setNeedsPlaceSelection(true);
    setPending(null);
    onAddressFallbackChange?.(text);
  }, [onAddressFallbackChange]);

  const handlePlaceSelected = useCallback(
    (place: google.maps.places.PlaceResult) => {
      const next = placeToPending(place, venueName);
      if (!next) {
        setNeedsPlaceSelection(true);
        return;
      }
      setPending(next);
      setSearchText(next.formattedAddress || next.venueName);
      setNeedsPlaceSelection(false);
      setConfirmed(false);
      if (!venueName.trim() && next.venueName) {
        setVenueName(next.venueName);
      }
    },
    [venueName]
  );

  const handleConfirm = useCallback(() => {
    if (!preview || !hasValidCoordinates(preview.latitude, preview.longitude)) {
      setNeedsPlaceSelection(true);
      return;
    }
    if (needsPlaceSelection && !pending) {
      setNeedsPlaceSelection(true);
      return;
    }
    const next: InvitationLocation = {
      venueName: venueName.trim() || preview.venueName,
      formattedAddress: preview.formattedAddress,
      detailAddress: detailAddress.trim() || undefined,
      googlePlaceId: preview.googlePlaceId,
      latitude: preview.latitude,
      longitude: preview.longitude,
    };
    setConfirmed(true);
    setNeedsPlaceSelection(false);
    onConfirm(next);
  }, [preview, needsPlaceSelection, pending, venueName, detailAddress, onConfirm]);

  const statusMessage = needsPlaceSelection
    ? '검색 결과에서 위치를 선택해 주세요.'
    : !confirmed && preview
      ? '지도를 확인한 뒤 위치를 확정해 주세요.'
      : null;

  const canConfirm = Boolean(preview && hasValidCoordinates(preview.latitude, preview.longitude) && !needsPlaceSelection);

  if (!hasApiKey) {
    return (
      <div className={styles.fallback} data-testid="location-picker-no-key">
        <p className={styles.fallbackTitle}>Google Maps API 키가 필요합니다</p>
        <p className={styles.fallbackBody}>
          `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`를 설정하면 주소 검색과 지도 확인을 사용할 수 있습니다. 지금은 주소
          텍스트만 저장할 수 있습니다.
        </p>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>장소명</span>
          <input
            type="text"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="예: 더 웨딩홀"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>주소</span>
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              onAddressFallbackChange?.(e.target.value);
            }}
            placeholder="예: 서울 구로구 경인로 610"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>상세 주소 (선택)</span>
          <input
            type="text"
            value={detailAddress}
            onChange={(e) => setDetailAddress(e.target.value)}
            placeholder="예: 그랜드볼룸 3층"
          />
        </label>
        <button
          type="button"
          className={styles.fallbackConfirm}
          onClick={() => {
            onConfirm({
              venueName: venueName.trim(),
              formattedAddress: searchText.trim(),
              detailAddress: detailAddress.trim() || undefined,
            });
            setConfirmed(true);
          }}
        >
          이 주소로 확정
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root} data-testid="location-picker">
      <label className={styles.field}>
        <span className={styles.fieldLabel}>장소명</span>
        <input
          type="text"
          value={venueName}
          onChange={(e) => {
            setVenueName(e.target.value);
            setConfirmed(false);
          }}
          placeholder="예: 더 웨딩홀"
          data-testid="location-venue-name"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>주소 검색</span>
        <PlaceSearchInput
          value={searchText}
          onChange={handleSearchChange}
          onPlaceSelected={handlePlaceSelected}
          disabled={loading}
        />
        {mapsError ? <p className={styles.error}>{mapsError}</p> : null}
      </label>

      <div className={styles.mapBlock}>
        <LocationPickerMap location={preview} />
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>상세 주소 (선택)</span>
        <input
          type="text"
          value={detailAddress}
          onChange={(e) => {
            setDetailAddress(e.target.value);
            setConfirmed(false);
          }}
          placeholder="예: 그랜드볼룸 3층"
          data-testid="location-detail-address"
        />
      </label>

      {preview ? (
        <LocationConfirmationCard
          location={{
            venueName: venueName.trim() || preview.venueName,
            formattedAddress: preview.formattedAddress,
            detailAddress: detailAddress.trim() || undefined,
            googlePlaceId: preview.googlePlaceId,
            latitude: preview.latitude,
            longitude: preview.longitude,
          }}
          confirmed={confirmed}
          canConfirm={canConfirm}
          statusMessage={statusMessage}
          onConfirm={handleConfirm}
        />
      ) : (
        <p className={styles.hint}>주소 검색 후 결과에서 위치를 선택하면 지도가 표시됩니다.</p>
      )}

      {confirmed && preview ? (
        <GoogleMapsExternalLinks
          location={{
            venueName: venueName.trim() || preview.venueName,
            formattedAddress: preview.formattedAddress,
            detailAddress: detailAddress.trim() || undefined,
            googlePlaceId: preview.googlePlaceId,
            latitude: preview.latitude,
            longitude: preview.longitude,
          }}
        />
      ) : null}
    </div>
  );
}

export default function LocationPicker(props: LocationPickerProps) {
  return (
    <GoogleMapsProvider>
      <LocationPickerInner {...props} />
    </GoogleMapsProvider>
  );
}
