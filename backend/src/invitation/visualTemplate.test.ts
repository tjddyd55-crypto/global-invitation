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

test('backend allowlist has 9 ids including ORGANIZATION_01_OFFICIAL', () => {
  assert.equal(VISUAL_TEMPLATE_IDS.length, 9);
  assert.ok(VISUAL_TEMPLATE_IDS.includes('ORGANIZATION_01_OFFICIAL'));
});

test('sanitize drops concept mismatch', () => {
  assert.equal(sanitizeVisualTemplateIdForSave('GENERAL_04_CLEAN', 'WEDDING'), undefined);
  assert.equal(sanitizeVisualTemplateIdForSave('WEDDING_04_EDITORIAL', 'WEDDING'), 'WEDDING_04_EDITORIAL');
  assert.equal(
    sanitizeVisualTemplateIdForSave('ORGANIZATION_01_OFFICIAL', 'ORGANIZATION'),
    'ORGANIZATION_01_OFFICIAL'
  );
  assert.equal(sanitizeVisualTemplateIdForSave('ORGANIZATION_01_OFFICIAL', 'GENERAL'), undefined);
});

test('applyVisualTemplateToDataJson omits invalid', () => {
  const next = applyVisualTemplateToDataJson(
    { title: 'x', visualTemplateId: 'GENERAL_04_CLEAN' },
    'WEDDING'
  );
  assert.equal(next.visualTemplateId, undefined);
  assert.equal(next.title, 'x');
});
