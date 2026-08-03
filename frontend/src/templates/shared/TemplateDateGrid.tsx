'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo } from 'react';
import {
  getInvitationScheduleCalendarModel,
  SCHEDULE_WEEKDAY_LABELS_KO,
} from '@/src/invitation/scheduleCalendar';
import styles from './TemplateDateGrid.module.css';

type TemplateDateGridProps = {
  eventDate?: string | Date | null;
  weddingDate?: Date | string | null;
  weddingDateTime?: string | null;
  variant: 'editorial' | 'garden' | 'night' | 'clean' | 'festive' | 'culture';
  className?: string;
};

export default function TemplateDateGrid({
  eventDate,
  weddingDate,
  weddingDateTime,
  variant,
  className,
}: TemplateDateGridProps) {
  const model = useMemo(
    () =>
      getInvitationScheduleCalendarModel({
        eventDate: typeof eventDate === 'string' ? eventDate : undefined,
        weddingDate,
        weddingDateTime: weddingDateTime ?? undefined,
      }),
    [eventDate, weddingDate, weddingDateTime]
  );

  if (!model) {
    return <div className={`${styles.grid} ${styles[variant]} ${className ?? ''}`.trim()} aria-hidden />;
  }

  return (
    <div
      className={`${styles.grid} ${styles[variant]} ${className ?? ''}`.trim()}
      aria-label={`${model.year}년 ${model.monthIndex + 1}월`}
    >
      {SCHEDULE_WEEKDAY_LABELS_KO.map((day) => (
        <span key={day} className={styles.weekday}>
          {day}
        </span>
      ))}
      {model.cells.map((day, index) => (
        <span
          key={`${day ?? 'e'}-${index}`}
          className={day === model.highlightDay ? styles.on : undefined}
          data-testid={day === model.highlightDay ? 'schedule-calendar-highlight' : undefined}
        >
          {day ?? ''}
        </span>
      ))}
    </div>
  );
}
