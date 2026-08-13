'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
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
  const { t } = useInvitationT();
  const { hasApiKey, error: mapsError, loading, ready, maps } = useGoogleMaps();
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
  const restoreAttemptedRef = useRef(false);

  // 저장값 복원 (재진입 / 부모 value 갱신)
  useEffect(() => {
    setVenueName(value.venueName || '');
    setDetailAddress(value.detailAddress || '');
    if (value.formattedAddress?.trim()) {
      setSearchText(value.formattedAddress);
    }
    if (hasValidCoordinates(value.latitude, value.longitude)) {
      setPending({
        venueName: value.venueName,
        formattedAddress: value.formattedAddress,
        detailAddress: value.detailAddress,
        googlePlaceId: value.googlePlaceId,
        latitude: value.latitude,
        longitude: value.longitude,
      });
      setConfirmed(Boolean(value.formattedAddress?.trim()));
      setNeedsPlaceSelection(false);
    }
  }, [
    value.venueName,
    value.detailAddress,
    value.formattedAddress,
    value.googlePlaceId,
    value.latitude,
    value.longitude,
  ]);

  // placeId / 주소 geocode fallback (좌표 없을 때)
  useEffect(() => {
    if (!ready || !maps || restoreAttemptedRef.current) return;
    if (hasValidCoordinates(value.latitude, value.longitude)) return;
    const placeId = value.googlePlaceId?.trim();
    const address = value.formattedAddress?.trim();
    if (!placeId && !address) return;

    restoreAttemptedRef.current = true;
    const geocoder = new maps.Geocoder();
    const request: google.maps.GeocoderRequest = placeId
      ? { placeId }
      : { address: address as string };

    geocoder.geocode(request, (results, status) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) return;
      const loc = results[0].geometry.location;
      setPending({
        venueName: value.venueName || '',
        formattedAddress: value.formattedAddress || results[0].formatted_address || '',
        detailAddress: value.detailAddress,
        googlePlaceId: value.googlePlaceId || results[0].place_id,
        latitude: loc.lat(),
        longitude: loc.lng(),
      });
      setConfirmed(Boolean(value.formattedAddress?.trim() || results[0].formatted_address));
      setNeedsPlaceSelection(false);
    });
  }, [ready, maps, value]);

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

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      setConfirmed(false);
      setNeedsPlaceSelection(true);
      setPending(null);
      onAddressFallbackChange?.(text);
    },
    [onAddressFallbackChange]
  );

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
    ? t('editor.map.selectFromResults')
    : !confirmed && preview
      ? t('editor.map.selectHint')
      : null;

  const canConfirm = Boolean(
    preview && hasValidCoordinates(preview.latitude, preview.longitude) && !needsPlaceSelection
  );

  if (!hasApiKey) {
    return (
      <div className={styles.fallback} data-testid="location-picker-no-key">
        <p className={styles.fallbackTitle}>{t('editor.map.googleKeyRequired')}</p>
        <p className={styles.fallbackBody}>{t('editor.map.googleKeyHint')}</p>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.map.venueName')}</span>
          <input
            type="text"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="예: Grand Ballroom"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.map.addressSearch')}</span>
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              onAddressFallbackChange?.(e.target.value);
            }}
            placeholder="예: 1 Infinite Loop, Cupertino"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.map.detailAddress')}</span>
          <input
            type="text"
            value={detailAddress}
            onChange={(e) => setDetailAddress(e.target.value)}
            placeholder="예: Floor 3"
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
          {t('editor.map.confirmHere')}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root} data-testid="location-picker">
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('editor.map.venueName')}</span>
        <input
          type="text"
          value={venueName}
          onChange={(e) => {
            setVenueName(e.target.value);
            setConfirmed(false);
          }}
          placeholder="예: Grand Ballroom"
          data-testid="location-venue-name"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('editor.map.addressSearch')}</span>
        <PlaceSearchInput
          value={searchText}
          onChange={handleSearchChange}
          onPlaceSelected={handlePlaceSelected}
          disabled={loading}
          placeholder={t('editor.map.searchPlaceholder')}
        />
        <p className={styles.hint}>{t('editor.map.selectHint')}</p>
        {mapsError ? <p className={styles.error}>{mapsError}</p> : null}
      </label>

      <div className={styles.mapBlock}>
        <LocationPickerMap location={preview} />
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('editor.map.detailAddress')}</span>
        <input
          type="text"
          value={detailAddress}
          onChange={(e) => {
            setDetailAddress(e.target.value);
            setConfirmed(false);
          }}
          placeholder="예: Floor 3"
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
        <p className={styles.hint}>{t('editor.map.selectFromResults')}</p>
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
