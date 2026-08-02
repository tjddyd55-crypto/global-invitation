/**
 * Invitation schedule calendar view-model SSOT.
 * Wedding / General Preview·Public 이 동일 계산을 사용한다.
 */

export type InvitationScheduleCalendarModel = {
  /** 유효한 이벤트 시각 */
  eventDate: Date;
  highlightDay: number;
  /** 일요일 시작 달력 셀 (null = 빈 칸) */
  cells: Array<number | null>;
  year: number;
  monthIndex: number; // 0-based
};

export function parseInvitationEventDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** 해당 월 달력 셀 (일요일 시작). */
export function buildCalendarCells(targetDate: Date): Array<number | null> {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  return cells;
}

/**
 * dataJson / runtime 에서 일정 달력 모델을 만든다.
 * 유효 날짜가 없으면 null (Public 숨김 / Preview placeholder 용).
 */
export function getInvitationScheduleCalendarModel(data: {
  weddingDate?: Date | string | null;
  eventDate?: string | null;
  weddingDateTime?: string | null;
}): InvitationScheduleCalendarModel | null {
  const eventDate =
    parseInvitationEventDate(data.weddingDate) ||
    parseInvitationEventDate(data.eventDate) ||
    parseInvitationEventDate(data.weddingDateTime);
  if (!eventDate) return null;
  return {
    eventDate,
    highlightDay: eventDate.getDate(),
    cells: buildCalendarCells(eventDate),
    year: eventDate.getFullYear(),
    monthIndex: eventDate.getMonth(),
  };
}

export const SCHEDULE_WEEKDAY_LABELS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;
