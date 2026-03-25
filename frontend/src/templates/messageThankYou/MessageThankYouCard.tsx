'use client';

import styles from './MessageThankYouCard.module.css';
import type { MessageThankYouInvitationData } from '@/src/invitation/schemas';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { formatDateTime } from '@/src/lib/i18n/format';
import { cdnImageSrc } from '@/src/lib/image';

type MessageThankYouCardProps = {
  data: MessageThankYouInvitationData;
  onCalendar?: () => void;
  onShare?: () => void;
  isShared?: boolean;
  onKakaoShare?: () => void;
  interactive?: boolean;
};

export default function MessageThankYouCard({
  data,
  onCalendar,
  onShare,
  isShared = false,
  onKakaoShare,
  interactive = true,
}: MessageThankYouCardProps) {
  const { t, language } = useI18n();
  const isDark = data.theme === 'dark';
  const canInteract = interactive;
  const hasActions = data.actions.calendar || data.actions.copyLink || data.actions.kakaoShare;

  const formatEventDate = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDateTime(language, date);
  };

  return (
    <div className={`${styles.page} ${isDark ? styles.pageDark : ''}`}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <img
            className={styles.heroImage}
            src={cdnImageSrc(data.coverImage)}
            alt={data.title}
            loading="eager"
            fetchPriority="high"
          />
          <div className={styles.heroOverlay}>
            <div className={styles.title}>{data.title}</div>
            {data.subtitle && <div className={styles.subtitle}>{data.subtitle}</div>}
          </div>
        </div>
        <div className={styles.body}>
          {data.description && <p className={styles.description}>{data.description}</p>}
          {(data.eventDate || data.location) && (
            <div className={styles.meta}>
              {data.eventDate && <span>📅 {formatEventDate(data.eventDate)}</span>}
              {data.location && <span>📍 {data.location}</span>}
            </div>
          )}
        </div>
      </div>

      {hasActions && (
        <div className={styles.actionBar}>
          <div className={styles.actionBarInner}>
            {data.actions.calendar && (
              <button
                type="button"
                className={`${styles.actionButton} ${!canInteract || !onCalendar ? styles.actionButtonDisabled : ''}`}
                onClick={onCalendar}
                disabled={!canInteract || !onCalendar}
              >
                <span className={styles.actionButtonIcon}>📅</span>
                {t(I18N_KEYS.message.actionCalendar)}
              </button>
            )}
            {data.actions.copyLink && onShare && (
              <button
                type="button"
                className={`${styles.actionButton} ${!canInteract || !onShare ? styles.actionButtonDisabled : ''}`}
                onClick={onShare}
                disabled={!canInteract || !onShare}
              >
                <span className={styles.actionButtonIcon}>🔗</span>
                {isShared ? t(I18N_KEYS.common.shared) : t(I18N_KEYS.common.share)}
              </button>
            )}
            {data.actions.kakaoShare && (
              <button
                type="button"
                className={`${styles.actionButton} ${!canInteract || !onKakaoShare ? styles.actionButtonDisabled : ''}`}
                onClick={onKakaoShare}
                disabled={!canInteract || !onKakaoShare}
              >
                <span className={styles.actionButtonIcon}>💬</span>
                {t(I18N_KEYS.message.actionKakaoShare)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
