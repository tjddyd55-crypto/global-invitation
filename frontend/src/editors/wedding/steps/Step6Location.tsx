'use client';

import LocationPicker, { type LocationPickerValue } from '@/src/maps/LocationPicker';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorLocation } from '../state/weddingEditor.types';

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

export default function Step6Location({
  value,
  venueName,
  venueDetail,
  onChange,
  onVenueChange,
}: Step6LocationProps) {
  const handleConfirm = (next: LocationPickerValue) => {
    onChange({
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

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>위치 안내</h2>
        <p>주소를 검색해 지도에서 확인한 뒤 위치를 확정합니다.</p>
      </div>

      <LocationPicker
        value={toPickerValue(value, venueName, venueDetail)}
        onConfirm={handleConfirm}
        onAddressFallbackChange={(address) => onChange({ address })}
      />

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
