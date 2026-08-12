import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT,
  isVisualTemplateId,
  listVisualTemplatesForConcept,
  VISUAL_TEMPLATE_IDS,
} from './ids';
import { resolveVisualTemplateId, sanitizeVisualTemplateIdForSave } from './resolveVisualTemplateId';
import { getAllVisualTemplateDefinitions, getVisualTemplateDefinition, listActiveVisualTemplates } from './visualTemplateRegistry';
import { getVisualTemplatePreviewFixture } from './previewFixtures';
import { ORGANIZATION_SAMPLE_LOGO } from './templateSampleAssets';

test('registry has 10 templates; wedding/general 02/03 placeholders absent', () => {
  assert.equal(VISUAL_TEMPLATE_IDS.length, 10);
  assert.ok(!VISUAL_TEMPLATE_IDS.some((id) => /^(WEDDING|GENERAL)_0[23]_/.test(id)));
  assert.ok(VISUAL_TEMPLATE_IDS.includes('ORGANIZATION_01_OFFICIAL'));
  assert.ok(VISUAL_TEMPLATE_IDS.includes('ORGANIZATION_02_JCI'));
  assert.equal(getAllVisualTemplateDefinitions().length, 10);
});

test('WEDDING and GENERAL each have 4; ORGANIZATION has Official + JCI', () => {
  assert.equal(listVisualTemplatesForConcept('WEDDING').length, 4);
  assert.equal(listVisualTemplatesForConcept('GENERAL').length, 4);
  assert.equal(listVisualTemplatesForConcept('ORGANIZATION').length, 2);
  assert.equal(listActiveVisualTemplates('WEDDING').length, 4);
  assert.equal(listActiveVisualTemplates('GENERAL').length, 4);
  assert.equal(listActiveVisualTemplates('ORGANIZATION').length, 2);
  const orgNames = listActiveVisualTemplates('ORGANIZATION').map((d) => d.name);
  assert.deepEqual(orgNames, ['공식', 'JCI']);
});

test('fallback when visualTemplateId missing', () => {
  assert.equal(resolveVisualTemplateId({ conceptType: 'WEDDING' }), 'WEDDING_01_CLASSIC');
  assert.equal(resolveVisualTemplateId({ conceptType: 'GENERAL' }), 'GENERAL_01_CLASSIC');
  assert.equal(resolveVisualTemplateId({ conceptType: 'ORGANIZATION' }), 'ORGANIZATION_01_OFFICIAL');
  assert.equal(resolveVisualTemplateId({ conceptType: 'FUNERAL' }), null);
});

test('concept mismatch falls back; save sanitizer drops invalid', () => {
  assert.equal(
    resolveVisualTemplateId({ conceptType: 'WEDDING', visualTemplateId: 'GENERAL_04_CLEAN' }),
    'WEDDING_01_CLASSIC'
  );
  assert.equal(sanitizeVisualTemplateIdForSave('GENERAL_04_CLEAN', 'WEDDING'), undefined);
  assert.equal(sanitizeVisualTemplateIdForSave('WEDDING_04_EDITORIAL', 'WEDDING'), 'WEDDING_04_EDITORIAL');
  assert.equal(
    sanitizeVisualTemplateIdForSave('ORGANIZATION_01_OFFICIAL', 'ORGANIZATION'),
    'ORGANIZATION_01_OFFICIAL'
  );
  assert.equal(
    sanitizeVisualTemplateIdForSave('ORGANIZATION_02_JCI', 'ORGANIZATION'),
    'ORGANIZATION_02_JCI'
  );
  assert.equal(sanitizeVisualTemplateIdForSave('ORGANIZATION_02_JCI', 'GENERAL'), undefined);
  assert.ok(isVisualTemplateId(DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT.WEDDING));
});

test('JCI template has registry entry and preview fixture', () => {
  const def = getVisualTemplateDefinition('ORGANIZATION_02_JCI');
  assert.equal(def.name, 'JCI');
  assert.equal(def.conceptType, 'ORGANIZATION');
  assert.equal(def.isActive, true);
  const fixture = getVisualTemplatePreviewFixture('ORGANIZATION_02_JCI');
  assert.equal(fixture.visualTemplateId, 'ORGANIZATION_02_JCI');
  assert.equal(fixture.organization?.logo, ORGANIZATION_SAMPLE_LOGO);
  assert.equal(fixture.organization?.presetId, 'JCI');
  assert.equal(fixture.organization?.name, '서울광진청년회의소');
});

test('Official template unchanged in registry metadata', () => {
  const official = listActiveVisualTemplates('ORGANIZATION').find(
    (d) => d.id === 'ORGANIZATION_01_OFFICIAL'
  );
  assert.ok(official);
  assert.equal(official?.name, '공식');
});

test('customer names do not expose internal numbers in registry name field', () => {
  for (const def of getAllVisualTemplateDefinitions()) {
    assert.ok(!/\d{2}/.test(def.name), def.name);
    assert.ok(!def.name.includes('WEDDING'));
    assert.ok(!def.name.includes('GENERAL'));
    assert.ok(!def.name.includes('ORGANIZATION'));
  }
});
