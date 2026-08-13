'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef } from 'react';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import { useGoogleMaps } from './GoogleMapsProvider';
import styles from './PlaceSearchInput.module.css';

type PlaceSearchInputProps = {
  value: string;
  onChange: (text: string) => void;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Places Autocomplete — 전 세계 장소/주소 (country 제한 없음).
 */
export default function PlaceSearchInput({
  value,
  onChange,
  onPlaceSelected,
  disabled,
  placeholder,
}: PlaceSearchInputProps) {
  const { t } = useInvitationT();
  const resolvedPlaceholder = placeholder || t('editor.map.searchPlaceholder');
  const { ready, maps } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  onPlaceSelectedRef.current = onPlaceSelected;

  useEffect(() => {
    if (!ready || !maps || !inputRef.current) return;

    const autocomplete = new maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id', 'name', 'formatted_address', 'geometry'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place?.geometry?.location) return;
      onPlaceSelectedRef.current(place);
    });

    return () => {
      listener.remove();
      maps.event.clearInstanceListeners(autocomplete);
    };
  }, [ready, maps]);

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={value}
        disabled={disabled || !ready}
        placeholder={ready ? resolvedPlaceholder : t('editor.map.loading')}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        data-testid="place-search-input"
      />
    </div>
  );
}
