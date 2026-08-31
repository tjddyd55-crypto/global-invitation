import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CODE_VISUAL_TEMPLATE_SEEDS,
  isCodeRegistryKey,
  listCodeRegistryKeys,
} from './codeRegistrySeed';
import {
  isCreateSelectableStatus,
  isPublicCatalogEligible,
  normalizeReorderSortOrders,
} from './catalogPolicy';

test('CODE registry seed covers 10 visual templates', () => {
  const keys = listCodeRegistryKeys();
  assert.equal(keys.length, 10);
  assert.equal(CODE_VISUAL_TEMPLATE_SEEDS.length, 10);
  assert.ok(keys.includes('WEDDING_05_GARDEN'));
  assert.ok(keys.includes('ORGANIZATION_02_JCI'));
});

test('registry concepts match expected counts', () => {
  const by = (c: string) => CODE_VISUAL_TEMPLATE_SEEDS.filter((s) => s.concept === c).length;
  assert.equal(by('WEDDING'), 4);
  assert.equal(by('GENERAL'), 4);
  assert.equal(by('ORGANIZATION'), 2);
});

test('public catalog requires ACTIVE + visible + registry', () => {
  const registryHas = (k: string) => isCodeRegistryKey(k);
  assert.equal(
    isPublicCatalogEligible({
      status: 'ACTIVE',
      isVisible: true,
      sourceType: 'CODE',
      templateKey: 'WEDDING_05_GARDEN',
      registryHas,
    }),
    true
  );
  assert.equal(
    isPublicCatalogEligible({
      status: 'ACTIVE',
      isVisible: true,
      sourceType: 'FIGMA_DEFINITION',
      templateKey: 'WEDDING_07_ROMANTIC_GARDEN',
      registryHas,
      hasValidActiveDefinition: true,
    }),
    true
  );
  assert.equal(
    isPublicCatalogEligible({
      status: 'ACTIVE',
      isVisible: true,
      sourceType: 'FIGMA_DEFINITION',
      templateKey: 'WEDDING_07_ROMANTIC_GARDEN',
      registryHas,
      hasValidActiveDefinition: false,
    }),
    false
  );
  assert.equal(
    isPublicCatalogEligible({
      status: 'ACTIVE',
      isVisible: false,
      sourceType: 'CODE',
      templateKey: 'WEDDING_05_GARDEN',
      registryHas,
    }),
    false
  );
  assert.equal(
    isPublicCatalogEligible({
      status: 'ARCHIVED',
      isVisible: true,
      sourceType: 'CODE',
      templateKey: 'WEDDING_05_GARDEN',
      registryHas,
    }),
    false
  );
  assert.equal(
    isPublicCatalogEligible({
      status: 'ACTIVE',
      isVisible: true,
      sourceType: 'CODE',
      templateKey: 'FAKE_TEMPLATE',
      registryHas,
    }),
    false
  );
});

test('create rejects hidden and archived', () => {
  assert.equal(isCreateSelectableStatus({ status: 'ACTIVE', isVisible: true }).ok, true);
  assert.equal(
    isCreateSelectableStatus({ status: 'ACTIVE', isVisible: false }).ok === false &&
      (isCreateSelectableStatus({ status: 'ACTIVE', isVisible: false }) as { code: string }).code,
    'VISUAL_TEMPLATE_HIDDEN'
  );
  assert.equal(
    (isCreateSelectableStatus({ status: 'ARCHIVED', isVisible: false }) as { code: string }).code,
    'VISUAL_TEMPLATE_ARCHIVED'
  );
  assert.equal(
    (isCreateSelectableStatus({ status: 'HIDDEN', isVisible: false }) as { code: string }).code,
    'VISUAL_TEMPLATE_HIDDEN'
  );
});

test('reorder normalizes to contiguous 1..n', () => {
  assert.deepEqual(normalizeReorderSortOrders(3), [1, 2, 3]);
});
