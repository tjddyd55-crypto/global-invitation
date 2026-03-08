'use client';

import styles from './MessageSimpleCard.module.css';
import type { MessageSimpleInvitationData } from '@/src/invitation/schemas';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type MessageSimpleCardProps = {
  data: MessageSimpleInvitationData;
  onShare?: () => void;
  isShared?: boolean;
  onKakaoShare?: () => void;
  onCalendarSave?: () => void;
};

export default function MessageSimpleCard({
  data,
  onShare,
  isShared = false,
  onKakaoShare,
  onCalendarSave,
}: MessageSimpleCardProps) {
  const { t } = useI18n();
  const hasSchedule = Boolean(data.schedule?.date || data.schedule?.time || data.schedule?.place);
  const hasActions = data.actions.copyLink || data.actions.kakaoShare || data.actions.calendarSave;
  const isCalendarEnabled = data.actions.calendarSave && Boolean(data.schedule?.date);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <img className={styles.heroImage} src={data.heroImage} alt={t(I18N_KEYS.message.heroImageAlt)} />
        </div>

        <div className={styles.textBlock}>
          {data.title && <div className={styles.title}>{data.title}</div>}
          {data.subtitle && <div className={styles.subtitle}>{data.subtitle}</div>}
        </div>

        <div className={styles.message}>{data.message}</div>

        {hasSchedule && (
          <div className={styles.schedule}>
            {data.schedule?.date && (
              <div>
                <span className={styles.scheduleLabel}>{t(I18N_KEYS.message.labelDate)}</span>
                {data.schedule.date}
              </div>
            )}
            {data.schedule?.time && (
              <div>
                <span className={styles.scheduleLabel}>{t(I18N_KEYS.message.labelTime)}</span>
                {data.schedule.time}
              </div>
            )}
            {data.schedule?.place && (
              <div>
                <span className={styles.scheduleLabel}>{t(I18N_KEYS.message.labelPlace)}</span>
                {data.schedule.place}
              </div>
            )}
          </div>
        )}

        {hasActions && (
          <div className={styles.actionBar}>
            <div className={styles.actionButtons}>
              {data.actions.copyLink && onShare && (
                <button type="button" className={styles.actionButton} onClick={onShare}>
                  {isShared ? t(I18N_KEYS.common.shared) : t(I18N_KEYS.common.share)}
                </button>
              )}
              {data.actions.kakaoShare && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                  onClick={onKakaoShare}
                >
                  {t(I18N_KEYS.message.actionKakaoShare)}
                </button>
              )}
              {data.actions.calendarSave && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${!isCalendarEnabled ? styles.actionButtonDisabled : ''}`}
                  onClick={onCalendarSave}
                  disabled={!isCalendarEnabled}
                >
                  {t(I18N_KEYS.message.actionCalendarSave)}
                </button>
              )}
            </div>
            <div className={styles.actionHint}>{t(I18N_KEYS.message.actionHint)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
