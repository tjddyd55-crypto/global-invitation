'use client';
/* eslint-disable i18next/no-literal-string */

import { buildGoogleMapsDirectionsUrl, buildGoogleMapsViewUrl } from './googleMapsUrls';
import type { InvitationLocation } from './types';
import styles from './GoogleMapsExternalLinks.module.css';

type GoogleMapsExternalLinksProps = {
  location: InvitationLocation;
  className?: string;
};

/**
 * Google-only 외부 지도 링크.
 * 네이버/카카오/티맵 등 국내 앱은 사용하지 않는다.
 */
export default function GoogleMapsExternalLinks({ location, className }: GoogleMapsExternalLinksProps) {
  const viewUrl = buildGoogleMapsViewUrl(location);
  const directionsUrl = buildGoogleMapsDirectionsUrl(location);
  const hasTarget = Boolean(
    location.googlePlaceId?.trim() ||
      location.formattedAddress?.trim() ||
      location.venueName?.trim() ||
      (typeof location.latitude === 'number' && typeof location.longitude === 'number')
  );

  if (!hasTarget) return null;

  return (
    <div className={`${styles.row} ${className || ''}`.trim()} data-testid="google-maps-external-links">
      <a className={styles.link} href={viewUrl} target="_blank" rel="noopener noreferrer">
        Google 지도에서 보기
      </a>
      <a className={styles.link} href={directionsUrl} target="_blank" rel="noopener noreferrer">
        Google Maps 길찾기
      </a>
    </div>
  );
}
