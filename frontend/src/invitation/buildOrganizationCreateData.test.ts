import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOrganizationCreateData } from './buildOrganizationCreateData';
import { ORGANIZATION_SAMPLE_LOGO } from '@/src/templates/visualTemplate/templateSampleAssets';
import { ORGANIZATION_SAMPLE_MUSIC } from '@/src/templates/visualTemplate/organizationSharedMusicSample';
import { ORGANIZATION_JCI_THEME } from '@/src/templates/organizationJci/organizationJciTheme';

test('Official create defaults: CUSTOM, no JCI logo/music, no sample names', () => {
  const data = buildOrganizationCreateData('ORGANIZATION_01_OFFICIAL');
  assert.equal(data.visualTemplateId, 'ORGANIZATION_01_OFFICIAL');
  const org = data.organization as Record<string, unknown>;
  assert.equal(org.presetId, 'CUSTOM');
  assert.equal(org.logo, '');
  assert.equal(org.name, '');
  assert.equal(org.englishName, '');
  const music = data.music as Record<string, unknown>;
  assert.equal(music.enabled, false);
});

test('JCI create defaults: preset JCI + shared logo + Song 1; no sample content', () => {
  const data = buildOrganizationCreateData('ORGANIZATION_02_JCI');
  assert.equal(data.visualTemplateId, 'ORGANIZATION_02_JCI');
  const org = data.organization as Record<string, unknown>;
  assert.equal(org.presetId, 'JCI');
  assert.equal(org.logo, ORGANIZATION_SAMPLE_LOGO);
  assert.equal(org.name, '');
  assert.equal(org.englishName, '');
  assert.equal(org.englishFullName, '');
  assert.equal(org.accentColor, ORGANIZATION_JCI_THEME.blue);
  assert.ok(!String(org.name).includes('서울광진'));
  const music = data.music as Record<string, unknown>;
  assert.equal(music.enabled, true);
  assert.equal(music.trackId, ORGANIZATION_SAMPLE_MUSIC.trackId);
  assert.equal(music.fileUrl, ORGANIZATION_SAMPLE_MUSIC.objectKey);
  assert.equal(music.title, ORGANIZATION_SAMPLE_MUSIC.title);
  assert.equal(data.title, undefined);
  assert.equal(data.venueName, undefined);
});
