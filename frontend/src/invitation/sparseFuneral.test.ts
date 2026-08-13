import assert from 'node:assert/strict';
import test from 'node:test';
import { toSparseFuneralLike } from './sparseFuneral';

test('toSparseFuneralLike keeps invitation language and does not inject Korean sample copy', () => {
  const next = toSparseFuneralLike({
    conceptType: 'FUNERAL',
    language: 'en-US',
    title: '[E2E-LOCALE] memorial',
    eventDate: '2026-10-17T10:00:00',
    locationText: 'Serenity Memorial Hall',
  });
  assert.equal((next as { language?: string }).language, 'en-US');
  assert.equal(next.conceptType, 'FUNERAL');
  assert.equal(next.deceasedName, '[E2E-LOCALE] memorial');
  assert.equal(next.funeralHall.name, 'Serenity Memorial Hall');
  assert.equal(next.schedule.funeralDate, '2026-10-17T10:00:00');
  assert.doesNotMatch(next.message || '', /삼가|명복/);
});
