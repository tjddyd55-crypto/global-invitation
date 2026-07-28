'use client';
/* eslint-disable i18next/no-literal-string */

import LocationPicker, { type LocationPickerValue } from '@/src/maps/LocationPicker';
import NaverLocationPicker, { type NaverPendingLocation } from '@/src/maps/NaverLocationPicker';
import styles from '../weddingEditor.module.css';
import mapStyles from '@/src/maps/LocationPicker.module.css';
import type { WeddingEditorLocation } from '../state/weddingEditor.types';
import type { InvitationMapProvider } from '@/src/invitation/mapSettings';

type Step6LocationProps = {
  value: WeddingEditorLocation;
  venueName: string;
  venueDetail?: string;
  onChange: (value: Partial<WeddingEditorLocation>) => void;
  onVenueChange: (value: { venueName?: string; venueDetail?: string }) => void;
};

function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function toPickerValue(
  value: WeddingEditorLocation,
  venueName: string,
  venueDetail?: string
): LocationPickerValue {
  return {
    venueName: (value.venueName || venueName || '').trim(),
    formattedAddress: (value.address || '').trim(),
    detailAddress: (value.detailAddress || venueDetail || '').trim() || undefined,
    googlePlaceId: value.googlePlaceId,
    latitude: value.mapLat,
    longitude: value.mapLng,
  };
}

/**
 * 위치 안내 — Google / Naver provider 선택.
 * provider 변경만으로 기존 확정 주소를 즉시 삭제하지 않음.
 */
export default function Step6Location({
  value,
  venueName,
  venueDetail,
  onChange,
  onVenueChange,
}: Step6LocationProps) {
  const provider: InvitationMapProvider = value.mapProvider === 'NAVER' ? 'NAVER' : 'GOOGLE';

  const handleProviderChange = (next: InvitationMapProvider) => {
    if (next === provider) return;
    onChange({ mapProvider: next });
  };

  const handleGoogleConfirm = (next: LocationPickerValue) => {
    onChange({
      mapProvider: 'GOOGLE',
      venueName: next.venueName,
      address: next.formattedAddress,
      detailAddress: next.detailAddress,
      googlePlaceId: next.googlePlaceId,
      mapLat: next.latitude,
      mapLng: next.longitude,
    });
    onVenueChange({
      venueName: next.venueName || venueName,
      venueDetail: next.detailAddress,
    });
  };

  const handleNaverConfirm = (next: NaverPendingLocation) => {
    onChange({
      mapProvider: 'NAVER',
      venueName: next.venueName,
      address: next.formattedAddress,
      detailAddress: next.detailAddress,
      naverPlaceId: next.naverPlaceId,
      naverMapUrl: next.naverMapUrl,
      mapLat: next.latitude,
      mapLng: next.longitude,
      // keep googlePlaceId if previously set — do not wipe on provider switch alone;
      // new confirm overwrites coordinates/address for active provider.
    });
    onVenueChange({
      venueName: next.venueName || venueName,
      venueDetail: next.detailAddress,
    });
  };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>위치 안내</h2>
        <p>지도 서비스를 선택한 뒤 장소를 검색·확정합니다.</p>
      </div>

      <div className={mapStyles.providerSwitch} data-testid="map-provider-switch">
        <button
          type="button"
          className={`${mapStyles.providerOption} ${provider === 'GOOGLE' ? mapStyles.providerOptionActive : ''}`}
          data-testid="map-provider-google"
          onClick={() => handleProviderChange('GOOGLE')}
        >
          <strong>Google 지도</strong>
          <span>전 세계 장소 검색 및 길찾기</span>
        </button>
        <button
          type="button"
          className={`${mapStyles.providerOption} ${provider === 'NAVER' ? mapStyles.providerOptionActive : ''}`}
          data-testid="map-provider-naver"
          onClick={() => handleProviderChange('NAVER')}
        >
          <strong>Naver 지도</strong>
          <span>대한민국 주소 및 장소 검색</span>
        </button>
      </div>

      {provider === 'GOOGLE' ? (
        <LocationPicker
          value={toPickerValue(value, venueName, venueDetail)}
          onConfirm={handleGoogleConfirm}
          onAddressFallbackChange={(address) => onChange({ address })}
        />
      ) : (
        <NaverLocationPicker
          initialQuery={value.address || venueName}
          confirmed={{
            venueName: value.venueName || venueName,
            formattedAddress: value.address,
            latitude: value.mapLat,
            longitude: value.mapLng,
          }}
          onConfirm={handleNaverConfirm}
        />
      )}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>교통 안내 (선택)</span>
        <textarea
          rows={3}
          value={(value.transportInfo ?? []).join('\n')}
          onChange={(event) => onChange({ transportInfo: toLines(event.target.value) })}
          placeholder="한 줄에 하나씩 입력"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>주차 안내 (선택)</span>
        <textarea
          rows={3}
          value={(value.parkingInfo ?? []).join('\n')}
          onChange={(event) => onChange({ parkingInfo: toLines(event.target.value) })}
          placeholder="한 줄에 하나씩 입력"
        />
      </label>
    </section>
  );
}
