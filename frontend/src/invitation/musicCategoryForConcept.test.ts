import assert from 'node:assert/strict';
import test from 'node:test';
import { musicCategoryForConcept } from './conceptTypes';

test('ORGANIZATION uses GENERAL music library category', () => {
  assert.equal(musicCategoryForConcept('ORGANIZATION'), 'GENERAL');
  assert.equal(musicCategoryForConcept('GENERAL'), 'GENERAL');
  assert.equal(musicCategoryForConcept('WEDDING'), 'WEDDING');
  assert.equal(musicCategoryForConcept('FUNERAL'), 'FUNERAL');
});
