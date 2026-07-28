'use client';

import { PUBLIC_MAP_HEIGHT_PX } from './config';
import type { InvitationMapSettings } from '@/src/invitation/mapSettings';
import { buildNaverMapsViewUrl } from './naverMapsUrls';
import styles from './PublicGoogleMap.module.css';

type PublicNaverMapProps = {
  settings: InvitationMapSettings;
  layoutPlaceholder?: boolean;
};

/**
 * Public Naver map — embed via static link panel when JS embed unavailable.
 * Keeps full-bleed height consistent with Google public map.
 */
export default function PublicNaverMap({ settings, layoutPlaceholder = false }: PublicNaverMapProps) {
  const viewUrl = buildNaverMapsViewUrl(settings);
  const hasCoords =
    typeof settings.latitude === 'number' && typeof settings.longitude === 'number';

  if (layoutPlaceholder) {
    return (
      <div
        className={styles.mapFrame}
        style={{ height: PUBLIC_MAP_HEIGHT_PX }}
        data-testid="public-naver-map-placeholder"
        data-qa-map-placeholder="1"
      />
    );
  }

  // Naver does not provide a simple iframe embed like Google Embed API without extra product setup.
  // Use interactive preview panel with deep link — same height budget as Google.
  return (
    <a
      className={styles.mapFrame}
      style={{
        height: PUBLIC_MAP_HEIGHT_PX,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        color: 'inherit',
        background: 'linear-gradient(180deg, #eef6f0 0%, #dfece3 100%)',
      }}
      href={viewUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="public-naver-map"
    >
      <span style={{ textAlign: 'center', padding: 16 }}>
        <strong style={{ display: 'block', marginBottom: 6 }}>Naver 지도</strong>
        <span style={{ fontSize: 13, color: '#3f4a43' }}>
          {settings.formattedAddress || settings.venueName || '지도에서 보기'}
        </span>
        {hasCoords ? null : null}
      </span>
    </a>
  );
}
