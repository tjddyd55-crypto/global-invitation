/**
 * 사람이 읽는 일정 표시 SSOT.
 *
 * renderer 가 날짜 문자열을 직접 조립하거나 ISO 원문(`2026-10-17T14:00:00`)을
 * 그대로 출력하지 않도록, 표시용 포맷을 여기서만 만든다.
 */
import { resolveInvitationLocale, type ProductLocaleId } from '@/src/i18n/productLocales';
import {
  getInvitationScheduleCalendarModel,
  SCHEDULE_WEEKDAY_LABELS_KO,
} from './scheduleCalendar';

const WEEKDAY_LABELS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** `2026-10-17`, `2026-10-17T14:00:00`, `2026/10/17 14:00` 등 기계용 표기 */
const MACHINE_DATE_PATTERN = /^\s*\d{4}[-/]\d{1,2}[-/]\d{1,2}([T\s].*)?$/;

export type InvitationScheduleDisplay = {
  year: number;
  /** 1~12 */
  month: number;
  /** 1~31 */
  day: number;
  /** `10` */
  monthPadded: string;
  /** `17` */
  dayPadded: string;
  weekdayKo: string;
  /** `토요일` */
  weekdayLongKo: string;
  /** `SAT` */
  weekdayEn: string;
  /** `오후 2시` — 자정(시간 미입력)이면 빈 문자열 */
  timeText: string;
  /** `10월 17일` */
  monthDayKo: string;
  /** `2026년 10월 17일 토요일 오후 2시` */
  full: string;
  /** `2026. 10. 17 SAT` */
  compact: string;
};

export function isMachineDateString(value: string): boolean {
  return MACHINE_DATE_PATTERN.test(value);
}

function formatTimeKo(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) return '';
  const meridiem = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0 ? `${meridiem} ${hour12}시` : `${meridiem} ${hour12}시 ${minutes}분`;
}

function formatTimeEn(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
  }).format(date);
}

function formatFullForLocale(date: Date, locale: ProductLocaleId, timeText: string): string {
  if (locale === 'en-US') {
    const dateText = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    return timeText ? `${dateText} · ${timeText}` : dateText;
  }
  const weekdayKo = SCHEDULE_WEEKDAY_LABELS_KO[date.getDay()];
  const fullBase = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdayKo}요일`;
  return timeText ? `${fullBase} ${timeText}` : fullBase;
}

export function getInvitationScheduleDisplay(
  data: {
    weddingDate?: Date | string | null;
    eventDate?: string | null;
    weddingDateTime?: string | null;
  },
  localeInput?: string | null
): InvitationScheduleDisplay | null {
  const model = getInvitationScheduleCalendarModel(data);
  if (!model) return null;

  const locale = resolveInvitationLocale(localeInput);
  const date = model.eventDate;
  const month = model.monthIndex + 1;
  const day = model.highlightDay;
  const weekdayKo = SCHEDULE_WEEKDAY_LABELS_KO[date.getDay()];
  const weekdayEn = WEEKDAY_LABELS_EN[date.getDay()];
  const timeText = locale === 'en-US' ? formatTimeEn(date) : formatTimeKo(date);
  const monthPadded = String(month).padStart(2, '0');
  const dayPadded = String(day).padStart(2, '0');

  return {
    year: model.year,
    month,
    day,
    monthPadded,
    dayPadded,
    weekdayKo,
    weekdayLongKo: `${weekdayKo}요일`,
    weekdayEn,
    timeText,
    monthDayKo: `${month}월 ${day}일`,
    full: formatFullForLocale(date, locale, timeText),
    compact:
      locale === 'en-US'
        ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
        : `${model.year}. ${monthPadded}. ${dayPadded} ${weekdayEn}`,
  };
}

/**
 * 저장된 schedule 문자열 중 사람이 읽을 수 있는 줄만 남긴다.
 * (레거시 데이터에 ISO 원문이 들어있는 경우가 있다)
 */
export function toDisplayScheduleLines(lines: string[]): string[] {
  return lines.filter((line) => line.trim() && !isMachineDateString(line));
}
