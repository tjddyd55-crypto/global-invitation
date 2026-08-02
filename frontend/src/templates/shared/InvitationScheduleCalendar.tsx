'use client';
/* eslint-disable i18next/no-literal-string */

import {
  SCHEDULE_WEEKDAY_LABELS_KO,
  type InvitationScheduleCalendarModel,
} from '@/src/invitation/scheduleCalendar';
import styles from './InvitationScheduleCalendar.module.css';

type InvitationScheduleCalendarProps = {
  model: InvitationScheduleCalendarModel;
  /** 섹션 제목 */
  title?: string;
  /** 포맷된 일시 한 줄 (예: 2025년 4월 13일 오후 5:20) */
  datetimeLabel?: string;
  /** 장소명 */
  venueLabel?: string;
  /** 상세 장소 / 홀 */
  detailLabel?: string;
  weekdayLabels?: readonly string[];
  tone?: 'wedding' | 'general' | 'funeral';
  className?: string;
  /** section wrapper attrs — Preview scroll anchor */
  sectionId?: string;
  testId?: string;
};

/**
 * Wedding / General 공용 달력형 일정 카드.
 * 월 그리드 + 선택일 강조 + 시간/장소 메타.
 */
export default function InvitationScheduleCalendar({
  model,
  title = '일정',
  datetimeLabel,
  venueLabel,
  detailLabel,
  weekdayLabels = SCHEDULE_WEEKDAY_LABELS_KO,
  tone = 'wedding',
  className,
  sectionId = 'schedule',
  testId = 'invitation-schedule-calendar',
}: InvitationScheduleCalendarProps) {
  const placeLine = [venueLabel, detailLabel].filter(Boolean).join(' · ');

  return (
    <section
      className={`${styles.section} ${styles[`tone_${tone}`]} ${className ?? ''}`.trim()}
      data-section-id={sectionId}
      data-preview-section={sectionId}
      data-testid={testId}
    >
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.calendarGrid} aria-label={`${model.year}년 ${model.monthIndex + 1}월`}>
        {weekdayLabels.map((day) => (
          <div key={day} className={`${styles.calendarCell} ${styles.calendarHeader}`}>
            {day}
          </div>
        ))}
        {model.cells.map((day, index) => (
          <div
            key={`${day ?? 'empty'}-${index}`}
            className={`${styles.calendarCell} ${
              day === model.highlightDay ? styles.calendarHighlight : ''
            }`.trim()}
            data-testid={day === model.highlightDay ? 'schedule-calendar-highlight' : undefined}
          >
            {day ?? ''}
          </div>
        ))}
      </div>
      {datetimeLabel || placeLine ? (
        <div className={styles.metaBlock}>
          {datetimeLabel ? <p className={styles.datetime}>{datetimeLabel}</p> : null}
          {placeLine ? <p className={styles.place}>{placeLine}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
