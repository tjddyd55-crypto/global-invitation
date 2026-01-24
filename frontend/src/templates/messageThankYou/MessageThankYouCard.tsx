'use client';

import styles from './MessageThankYouCard.module.css';
import type { MessageCardData } from '@/src/models/messageCard';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type MessageThankYouCardProps = {
  data: MessageCardData;
  onCalendar?: () => void;
  onCopyLink?: () => void;
  onKakaoShare?: () => void;
  interactive?: boolean;
};

export default function MessageThankYouCard({
  data,
  onCalendar,
  onCopyLink,
  onKakaoShare,
  interactive = true,
}: MessageThankYouCardProps) {
  const { t, language } = useI18n();
  const isDark = data.theme === 'dark';
  const canInteract = interactive;
  const hasActions = data.actions.calendar || data.actions.copyLink || data.actions.kakaoShare;
  const locale = language === 'ko' ? 'ko-KR' : language === 'mn' ? 'mn-MN' : 'en-US';

  return (
    <div className={`${styles.page} ${isDark ? styles.pageDark : ''}`}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <img className={styles.heroImage} src={data.coverImage} alt={data.title} />
          <div className={styles.heroOverlay}>
            <div className={styles.title}>{data.title}</div>
            {data.subtitle && <div className={styles.subtitle}>{data.subtitle}</div>}
          </div>
        </div>
        <div className={styles.body}>
          {data.description && <p className={styles.description}>{data.description}</p>}
          {(data.eventDate || data.location) && (
            <div className={styles.meta}>
              {data.eventDate && <span>📅 {new Date(data.eventDate).toLocaleString(locale)}</span>}
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
            {data.actions.copyLink && (
              <button
                type="button"
                className={`${styles.actionButton} ${!canInteract || !onCopyLink ? styles.actionButtonDisabled : ''}`}
                onClick={onCopyLink}
                disabled={!canInteract || !onCopyLink}
              >
                <span className={styles.actionButtonIcon}>🔗</span>
                {t(I18N_KEYS.message.actionCopyLink)}
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
