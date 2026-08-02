/**
 * Unit checks for shared schedule calendar view-model.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCalendarCells,
  getInvitationScheduleCalendarModel,
  parseInvitationEventDate,
} from './scheduleCalendar';

test('parseInvitationEventDate rejects invalid', () => {
  assert.equal(parseInvitationEventDate(''), null);
  assert.equal(parseInvitationEventDate('not-a-date'), null);
});

test('buildCalendarCells starts on Sunday and covers the month', () => {
  // 2025-04-01 = Tuesday → leading nulls then day 1
  const date = new Date(2025, 3, 13);
  const cells = buildCalendarCells(date);
  assert.equal(cells[0], null);
  assert.equal(cells[1], null);
  assert.equal(cells[2], 1);
  assert.ok(cells.includes(30));
  assert.equal(cells.filter((d) => d != null).length, 30);
});

test('getInvitationScheduleCalendarModel prefers weddingDate then eventDate', () => {
  const model = getInvitationScheduleCalendarModel({
    eventDate: '2025-04-13T17:20',
    weddingDateTime: '2025년 4월 13일 오후 5:20',
  });
  assert.ok(model);
  assert.equal(model!.highlightDay, 13);
  assert.equal(model!.monthIndex, 3);
  assert.equal(model!.year, 2025);
});

test('missing date returns null', () => {
  assert.equal(getInvitationScheduleCalendarModel({}), null);
});
