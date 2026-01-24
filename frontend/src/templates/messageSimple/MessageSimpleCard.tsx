'use client';

import styles from './MessageSimpleCard.module.css';
import type { MessageCardSimple } from '@/src/models/messageSimple';

type MessageSimpleCardProps = {
  data: MessageCardSimple;
  onCopyLink?: () => void;
  onKakaoShare?: () => void;
  onCalendarSave?: () => void;
};

export default function MessageSimpleCard({
  data,
  onCopyLink,
  onKakaoShare,
  onCalendarSave,
}: MessageSimpleCardProps) {
  const hasSchedule = Boolean(data.schedule?.date || data.schedule?.time || data.schedule?.place);
  const hasActions = data.actions.copyLink || data.actions.kakaoShare || data.actions.calendarSave;
  const isCalendarEnabled = data.actions.calendarSave && Boolean(data.schedule?.date);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <img className={styles.heroImage} src={data.heroImage} alt="message hero" />
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
                <span className={styles.scheduleLabel}>날짜</span>
                {data.schedule.date}
              </div>
            )}
            {data.schedule?.time && (
              <div>
                <span className={styles.scheduleLabel}>시간</span>
                {data.schedule.time}
              </div>
            )}
            {data.schedule?.place && (
              <div>
                <span className={styles.scheduleLabel}>장소</span>
                {data.schedule.place}
              </div>
            )}
          </div>
        )}

        {hasActions && (
          <div className={styles.actionBar}>
            <div className={styles.actionButtons}>
              {data.actions.copyLink && (
                <button type="button" className={styles.actionButton} onClick={onCopyLink}>
                  링크 복사
                </button>
              )}
              {data.actions.kakaoShare && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                  onClick={onKakaoShare}
                >
                  카카오 공유
                </button>
              )}
              {data.actions.calendarSave && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${!isCalendarEnabled ? styles.actionButtonDisabled : ''}`}
                  onClick={onCalendarSave}
                  disabled={!isCalendarEnabled}
                >
                  일정 저장
                </button>
              )}
            </div>
            <div className={styles.actionHint}>공유 버튼은 서비스 준비 단계에서 stub 상태입니다.</div>
          </div>
        )}
      </div>
    </div>
  );
}
