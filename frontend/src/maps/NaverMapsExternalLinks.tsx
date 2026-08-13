'use client';
/* eslint-disable i18next/no-literal-string */

import type { InvitationMapSettings } from '@/src/invitation/mapSettings';
import { useInvitationLocale } from '@/src/i18n/InvitationLocaleContext';
import { invitationT } from '@/src/i18n/invitationT';
import { buildNaverMapsDirectionsUrl, buildNaverMapsViewUrl } from './naverMapsUrls';
import styles from './GoogleMapsExternalLinks.module.css';

type NaverMapsExternalLinksProps = {
  settings: InvitationMapSettings;
};

export default function NaverMapsExternalLinks({ settings }: NaverMapsExternalLinksProps) {
  const locale = useInvitationLocale();
  const t = (key: string) => invitationT(locale, key);
  const viewUrl = buildNaverMapsViewUrl(settings);
  const directionsUrl = buildNaverMapsDirectionsUrl(settings);

  return (
    <div className={styles.row} data-testid="naver-maps-external-links">
      <a className={styles.link} href={viewUrl} target="_blank" rel="noopener noreferrer">
        {t('invitation.map.view')}
      </a>
      <a className={styles.link} href={directionsUrl} target="_blank" rel="noopener noreferrer">
        {t('invitation.map.directions')}
      </a>
    </div>
  );
}
