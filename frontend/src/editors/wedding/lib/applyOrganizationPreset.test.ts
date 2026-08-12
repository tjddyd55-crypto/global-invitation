import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyOrganizationPreset,
  matchesOrganizationPresetDefaults,
} from './applyOrganizationPreset';
import { ORGANIZATION_SAMPLE_LOGO } from '@/src/templates/visualTemplate/templateSampleAssets';
import { JCI_CREED_SONG_ASSET } from '@/src/invitation/organizationPresets';
import { DEFAULT_BRAND_ACCENT_COLOR } from '@/src/invitation/conceptTypes';

const emptyMusic = {
  musicEnabled: false,
  musicSourceType: undefined,
  musicTrackId: undefined,
  musicKey: undefined,
  musicFileUrl: undefined,
  musicFileKey: undefined,
  musicTitle: undefined,
  musicLoop: false,
  musicStartAtSeconds: 0,
};

test('CUSTOM → JCI applies shared logo and Creed Song without touching names/accent', () => {
  const result = applyOrganizationPreset({
    presetId: 'JCI',
    organization: {
      name: 'My Org',
      englishName: 'My Org EN',
      logo: '',
      accentColor: DEFAULT_BRAND_ACCENT_COLOR,
      presetId: 'CUSTOM',
    },
    music: emptyMusic,
  });
  assert.equal(result.organization.presetId, 'JCI');
  assert.equal(result.organization.logo, ORGANIZATION_SAMPLE_LOGO);
  assert.equal(result.organization.name, 'My Org');
  assert.equal(result.organization.englishName, 'My Org EN');
  assert.equal(result.organization.accentColor, DEFAULT_BRAND_ACCENT_COLOR);
  assert.equal(result.music.musicEnabled, true);
  assert.equal(result.music.musicTrackId, JCI_CREED_SONG_ASSET.trackId);
  assert.equal(result.music.musicTitle, 'JCI Creed Song');
  assert.equal(result.appliedAssets, true);
});

test('JCI → CUSTOM keeps logo and music', () => {
  const result = applyOrganizationPreset({
    presetId: 'CUSTOM',
    organization: {
      presetId: 'JCI',
      logo: ORGANIZATION_SAMPLE_LOGO,
      name: 'Keep',
    },
    music: {
      ...emptyMusic,
      musicEnabled: true,
      musicTrackId: JCI_CREED_SONG_ASSET.trackId,
      musicKey: JCI_CREED_SONG_ASSET.trackId,
      musicFileUrl: JCI_CREED_SONG_ASSET.objectKey,
      musicTitle: JCI_CREED_SONG_ASSET.title,
      musicSourceType: 'SHARED',
    },
  });
  assert.equal(result.organization.presetId, 'CUSTOM');
  assert.equal(result.organization.logo, ORGANIZATION_SAMPLE_LOGO);
  assert.equal(result.music.musicTrackId, JCI_CREED_SONG_ASSET.trackId);
  assert.equal(result.appliedAssets, false);
});

test('matchesOrganizationPresetDefaults detects overrides', () => {
  const org = {
    presetId: 'JCI' as const,
    logo: ORGANIZATION_SAMPLE_LOGO,
  };
  const music = {
    ...emptyMusic,
    musicEnabled: true,
    musicTrackId: JCI_CREED_SONG_ASSET.trackId,
    musicKey: JCI_CREED_SONG_ASSET.trackId,
  };
  assert.equal(matchesOrganizationPresetDefaults('JCI', org, music), true);
  assert.equal(
    matchesOrganizationPresetDefaults('JCI', { ...org, logo: 'invitation/development/users/u/a.webp' }, music),
    false
  );
});
