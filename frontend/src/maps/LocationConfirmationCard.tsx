'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import type { InvitationLocation } from './types';
import styles from './LocationConfirmationCard.module.css';

type LocationConfirmationCardProps = {
  location: InvitationLocation;
  confirmed: boolean;
  canConfirm: boolean;
  statusMessage?: string | null;
  onConfirm: () => void;
};

export default function LocationConfirmationCard({
  location,
  confirmed,
  canConfirm,
  statusMessage,
  onConfirm,
}: LocationConfirmationCardProps) {
  const { t } = useInvitationT();
  return (
    <div className={styles.card} data-testid="location-confirmation-card">
      <p className={styles.selectedLabel}>
        {confirmed ? t('editor.map.confirmedLabel') : t('editor.map.selectedLabel')}
      </p>
      <div className={styles.row}>
        <span className={styles.label}>{t('editor.map.venueName')}</span>
        <strong className={styles.value}>{location.venueName || '—'}</strong>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t('editor.funeral.address')}</span>
        <span className={styles.value}>{location.formattedAddress || '—'}</span>
      </div>
      {location.detailAddress?.trim() ? (
        <div className={styles.row}>
          <span className={styles.label}>{t('editor.map.detail')}</span>
          <span className={styles.value}>{location.detailAddress}</span>
        </div>
      ) : null}
      {statusMessage ? <p className={styles.status}>{statusMessage}</p> : null}
      <button
        type="button"
        className={confirmed ? `${styles.confirmBtn} ${styles.confirmed}` : styles.confirmBtn}
        onClick={onConfirm}
        disabled={!canConfirm}
        data-testid="location-confirm-button"
      >
        {confirmed ? t('editor.map.confirmedOk') : t('editor.map.confirmHere')}
      </button>
    </div>
  );
}
