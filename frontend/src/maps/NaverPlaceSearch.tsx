'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from './LocationPicker.module.css';

export type NaverGeocodeItem = {
  title: string;
  address: string;
  lat: number;
  lng: number;
};

type NaverPlaceSearchProps = {
  query: string;
  loading?: boolean;
  error?: string | null;
  results: NaverGeocodeItem[];
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onSelect: (item: NaverGeocodeItem) => void;
};

/**
 * Naver place/address search UI (Editor).
 * Geocode 호출은 부모(NaverLocationPicker)가 담당한다.
 */
export default function NaverPlaceSearch({
  query,
  loading,
  error,
  results,
  onQueryChange,
  onSearch,
  onSelect,
}: NaverPlaceSearchProps) {
  const { t } = useInvitationT();
  return (
    <>
      <div className={styles.searchRow}>
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('editor.map.naverSearchPlaceholder')}
          data-testid="naver-place-search"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSearch();
            }
          }}
        />
        <button type="button" onClick={onSearch} disabled={loading}>
          {t('editor.map.search')}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {results.length > 0 ? (
        <ul className={styles.results} data-testid="naver-search-results">
          {results.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.address}`}>
              <button type="button" onClick={() => onSelect(item)}>
                <strong>{item.title}</strong>
                <span>{item.address}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
