'use client';

import styles from './MessageBrandedJCI.module.css';
import type { MessageBrandedInvitationData } from '@/src/invitation/schemas';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { cdnImageSrc } from '@/src/lib/image';

type MessageBrandedJCIProps = {
  data: MessageBrandedInvitationData;
  onShare?: () => void;
  isShared?: boolean;
  previewMode?: boolean;
};

function buildMapSrc(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
}

export default function MessageBrandedJCI({
  data,
  onShare,
  isShared = false,
  previewMode = false,
}: MessageBrandedJCIProps) {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img
          className={styles.logo}
          src={cdnImageSrc(data.brand.logo)}
          alt={`${data.brand.name} ${t(I18N_KEYS.messageBranded.logoAlt)}`}
          loading="lazy"
        />
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <img
              className={styles.heroImage}
              src={cdnImageSrc(data.heroImage)}
              alt={t(I18N_KEYS.messageBranded.heroImageAlt)}
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div>
            <div className={styles.title}>{data.title}</div>
            <div className={styles.message}>{data.message}</div>
          </div>
          <div className={styles.schedule}>
            <div>
              <span className={styles.scheduleLabel}>{t(I18N_KEYS.message.labelSchedule)}</span>
              {data.schedule.date} {data.schedule.time}
            </div>
            <div>
              <span className={styles.scheduleLabel}>{t(I18N_KEYS.message.labelPlace)}</span>
              {data.schedule.place}
            </div>
          </div>
          {previewMode ? (
            <div className={`${styles.mapFrame} ${styles.mapPlaceholder}`} role="img" aria-label={data.map.label}>
              {data.map.label}
            </div>
          ) : (
            <iframe
              className={styles.mapFrame}
              src={buildMapSrc(data.map.lat, data.map.lng)}
              title={data.map.label}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          {!previewMode && onShare && (
            <button type="button" className={styles.shareButton} onClick={onShare}>
              {isShared ? t(I18N_KEYS.common.shared) : t(I18N_KEYS.common.share)}
            </button>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.brandName}>{data.brand.name}</div>
      </footer>
    </div>
  );
}
