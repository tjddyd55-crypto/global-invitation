import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT,
  isVisualTemplateId,
  listVisualTemplatesForConcept,
  VISUAL_TEMPLATE_IDS,
} from './ids';
import { resolveVisualTemplateId, sanitizeVisualTemplateIdForSave } from './resolveVisualTemplateId';
import { getAllVisualTemplateDefinitions, listActiveVisualTemplates } from './visualTemplateRegistry';

test('registry has exactly 8 templates without 02/03', () => {
  assert.equal(VISUAL_TEMPLATE_IDS.length, 8);
  assert.ok(!VISUAL_TEMPLATE_IDS.some((id) => id.includes('_02_') || id.includes('_03_')));
  assert.equal(getAllVisualTemplateDefinitions().length, 8);
});

test('WEDDING and GENERAL each have 4 active templates', () => {
  assert.equal(listVisualTemplatesForConcept('WEDDING').length, 4);
  assert.equal(listVisualTemplatesForConcept('GENERAL').length, 4);
  assert.equal(listActiveVisualTemplates('WEDDING').length, 4);
  assert.equal(listActiveVisualTemplates('GENERAL').length, 4);
});

test('fallback when visualTemplateId missing', () => {
  assert.equal(resolveVisualTemplateId({ conceptType: 'WEDDING' }), 'WEDDING_01_CLASSIC');
  assert.equal(resolveVisualTemplateId({ conceptType: 'GENERAL' }), 'GENERAL_01_CLASSIC');
  assert.equal(resolveVisualTemplateId({ conceptType: 'FUNERAL' }), null);
});

test('concept mismatch falls back; save sanitizer drops invalid', () => {
  assert.equal(
    resolveVisualTemplateId({ conceptType: 'WEDDING', visualTemplateId: 'GENERAL_04_CLEAN' }),
    'WEDDING_01_CLASSIC'
  );
  assert.equal(sanitizeVisualTemplateIdForSave('GENERAL_04_CLEAN', 'WEDDING'), undefined);
  assert.equal(sanitizeVisualTemplateIdForSave('WEDDING_04_EDITORIAL', 'WEDDING'), 'WEDDING_04_EDITORIAL');
  assert.ok(isVisualTemplateId(DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT.WEDDING));
});

test('customer names do not expose internal numbers in registry name field', () => {
  for (const def of getAllVisualTemplateDefinitions()) {
    assert.ok(!/\d{2}/.test(def.name), def.name);
    assert.ok(!def.name.includes('WEDDING'));
    assert.ok(!def.name.includes('GENERAL'));
  }
});
