'use client';
/* eslint-disable i18next/no-literal-string */

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
  return (
    <div className={styles.card} data-testid="location-confirmation-card">
      <div className={styles.row}>
        <span className={styles.label}>장소명</span>
        <strong className={styles.value}>{location.venueName || '—'}</strong>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>주소</span>
        <span className={styles.value}>{location.formattedAddress || '—'}</span>
      </div>
      {location.detailAddress?.trim() ? (
        <div className={styles.row}>
          <span className={styles.label}>상세</span>
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
        {confirmed ? '위치가 확정되었습니다' : '이 위치로 확정'}
      </button>
    </div>
  );
}
