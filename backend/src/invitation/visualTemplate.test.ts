/**
 * Backend visual template allowlist unit test.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyVisualTemplateToDataJson,
  sanitizeVisualTemplateIdForSave,
  VISUAL_TEMPLATE_IDS,
} from './visualTemplate';

test('backend allowlist has 8 ids', () => {
  assert.equal(VISUAL_TEMPLATE_IDS.length, 8);
});

test('sanitize drops concept mismatch', () => {
  assert.equal(sanitizeVisualTemplateIdForSave('GENERAL_04_CLEAN', 'WEDDING'), undefined);
  assert.equal(sanitizeVisualTemplateIdForSave('WEDDING_04_EDITORIAL', 'WEDDING'), 'WEDDING_04_EDITORIAL');
});

test('applyVisualTemplateToDataJson omits invalid', () => {
  const next = applyVisualTemplateToDataJson(
    { title: 'x', visualTemplateId: 'GENERAL_04_CLEAN' },
    'WEDDING'
  );
  assert.equal(next.visualTemplateId, undefined);
  assert.equal(next.title, 'x');
});
