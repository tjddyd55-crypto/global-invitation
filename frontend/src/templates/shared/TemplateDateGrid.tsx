'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo } from 'react';
import {
  getInvitationScheduleCalendarModel,
  scheduleCalendarAriaLabel,
  scheduleWeekdayLabels,
} from '@/src/invitation/scheduleCalendar';
import styles from './TemplateDateGrid.module.css';

type TemplateDateGridProps = {
  eventDate?: string | Date | null;
  weddingDate?: Date | string | null;
  weddingDateTime?: string | null;
  variant: 'editorial' | 'garden' | 'night' | 'clean' | 'festive' | 'culture';
  className?: string;
  locale?: string | null;
};

export default function TemplateDateGrid({
  eventDate,
  weddingDate,
  weddingDateTime,
  variant,
  className,
  locale,
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
  const weekdays = scheduleWeekdayLabels(locale);

  if (!model) {
    return <div className={`${styles.grid} ${styles[variant]} ${className ?? ''}`.trim()} aria-hidden />;
  }

  return (
    <div
      className={`${styles.grid} ${styles[variant]} ${className ?? ''}`.trim()}
      aria-label={scheduleCalendarAriaLabel(model.year, model.monthIndex, locale)}
    >
      {weekdays.map((day, index) => (
        <span key={`${day}-${index}`} className={styles.weekday}>
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
