'use client';
/* eslint-disable i18next/no-literal-string */

import type { InvitationMapSettings } from '@/src/invitation/mapSettings';
import { buildNaverMapsDirectionsUrl, buildNaverMapsViewUrl } from './naverMapsUrls';
import styles from './GoogleMapsExternalLinks.module.css';

type NaverMapsExternalLinksProps = {
  settings: InvitationMapSettings;
};

export default function NaverMapsExternalLinks({ settings }: NaverMapsExternalLinksProps) {
  const viewUrl = buildNaverMapsViewUrl(settings);
  const directionsUrl = buildNaverMapsDirectionsUrl(settings);

  return (
    <div className={styles.row} data-testid="naver-maps-external-links">
      <a className={styles.link} href={viewUrl} target="_blank" rel="noopener noreferrer">
        지도에서 보기
      </a>
      <a className={styles.link} href={directionsUrl} target="_blank" rel="noopener noreferrer">
        길찾기
      </a>
    </div>
  );
}
