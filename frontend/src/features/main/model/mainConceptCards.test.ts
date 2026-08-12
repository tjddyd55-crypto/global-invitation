import assert from 'node:assert/strict';
import test from 'node:test';
import { listMainConceptCards } from './mainConceptCards';
import { CONCEPT_OPTIONS } from '@/src/features/templates/model/conceptOptions';

test('home category cards match CONCEPT_OPTIONS including ORGANIZATION', () => {
  const cards = listMainConceptCards();
  assert.equal(cards.length, 4);
  assert.deepEqual(
    cards.map((c) => c.value),
    CONCEPT_OPTIONS.map((c) => c.value)
  );
  const org = cards.find((c) => c.value === 'ORGANIZATION');
  assert.ok(org);
  assert.equal(org?.homeTitle, '기업·단체 초대장');
  assert.equal(org?.key, 'organization');
});
