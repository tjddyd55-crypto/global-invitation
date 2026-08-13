import assert from 'node:assert/strict';
import test from 'node:test';
import { LOCALES } from './locales';
import { PRODUCT_MODE_EN, PRODUCT_MODE_KO } from './productModeCopy';

test('ko-KR and en-US product mode dictionaries have the same keys', () => {
  const koKeys = Object.keys(PRODUCT_MODE_KO).sort();
  const enKeys = Object.keys(PRODUCT_MODE_EN).sort();
  assert.deepEqual(koKeys, enKeys);
});

test('full locale dictionaries ko/en have identical key sets', () => {
  const koKeys = Object.keys(LOCALES.ko).sort();
  const enKeys = Object.keys(LOCALES.en).sort();
  assert.deepEqual(koKeys, enKeys);
});
