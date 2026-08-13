/**
 * 일정 표시 SSOT — 고객 화면에 ISO 원문이 나오지 않아야 한다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getInvitationScheduleDisplay,
  isMachineDateString,
  toDisplayScheduleLines,
} from './scheduleDisplay';

test('en-US locale formats a natural English date', () => {
  const display = getInvitationScheduleDisplay({ eventDate: '2026-08-13T19:00:00' }, 'en-US');
  assert.ok(display);
  assert.match(display.full, /August 13, 2026/i);
  assert.match(display.full, /7:00\s?PM|7\s?PM/i);
});

test('ISO 일시는 한국어 문장으로 변환된다', () => {
  const display = getInvitationScheduleDisplay({ eventDate: '2026-10-17T14:00:00' });
  assert.ok(display);
  assert.equal(display?.full, '2026년 10월 17일 토요일 오후 2시');
  assert.equal(display?.compact, '2026. 10. 17 SAT');
  assert.equal(display?.timeText, '오후 2시');
  assert.equal(display?.monthDayKo, '10월 17일');
});

test('자정은 시간을 표기하지 않는다', () => {
  const display = getInvitationScheduleDisplay({ eventDate: '2026-10-17T00:00:00' });
  assert.equal(display?.full, '2026년 10월 17일 토요일');
  assert.equal(display?.timeText, '');
});

test('분 단위가 있으면 함께 표기한다', () => {
  const display = getInvitationScheduleDisplay({ eventDate: '2026-04-13T17:20:00' });
  assert.equal(display?.timeText, '오후 5시 20분');
  assert.equal(display?.weekdayEn, 'MON');
});

test('유효 날짜가 없으면 null', () => {
  assert.equal(getInvitationScheduleDisplay({ eventDate: '' }), null);
  assert.equal(getInvitationScheduleDisplay({ eventDate: 'not-a-date' }), null);
});

test('기계용 날짜 문자열을 판별한다', () => {
  assert.ok(isMachineDateString('2026-10-17T14:00:00'));
  assert.ok(isMachineDateString('2026-10-17'));
  assert.ok(isMachineDateString('2026/10/17 14:00'));
  assert.ok(!isMachineDateString('2026년 10월 17일 토요일 오후 2시'));
  assert.ok(!isMachineDateString('13:00 — 19:00'));
});

test('schedule 라인에서 ISO 원문을 걸러낸다', () => {
  assert.deepEqual(
    toDisplayScheduleLines(['2026-10-17T14:00:00', '2026년 10월 17일 오후 2시', '  ']),
    ['2026년 10월 17일 오후 2시']
  );
});
