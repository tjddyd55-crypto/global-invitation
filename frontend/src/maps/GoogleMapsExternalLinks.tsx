'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationLocale } from '@/src/i18n/InvitationLocaleContext';
import { invitationT } from '@/src/i18n/invitationT';
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
  const locale = useInvitationLocale();
  const t = (key: string) => invitationT(locale, key);
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
        {t('invitation.map.googleView')}
      </a>
      <a className={styles.link} href={directionsUrl} target="_blank" rel="noopener noreferrer">
        {t('invitation.map.googleDirections')}
      </a>
    </div>
  );
}
