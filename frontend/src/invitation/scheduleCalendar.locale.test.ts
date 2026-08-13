import assert from 'node:assert/strict';
import test from 'node:test';
import { scheduleCalendarAriaLabel, scheduleWeekdayLabels } from './scheduleCalendar';

test('schedule weekday labels follow invitation locale', () => {
  assert.deepEqual(scheduleWeekdayLabels('ko-KR'), ['일', '월', '화', '수', '목', '금', '토']);
  assert.deepEqual(scheduleWeekdayLabels('en-US'), ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  assert.deepEqual(scheduleWeekdayLabels(undefined), ['일', '월', '화', '수', '목', '금', '토']);
});

test('schedule calendar aria-label follows invitation locale', () => {
  assert.equal(scheduleCalendarAriaLabel(2026, 11, 'ko-KR'), '2026년 12월');
  assert.match(scheduleCalendarAriaLabel(2026, 11, 'en-US'), /December 2026/i);
});
