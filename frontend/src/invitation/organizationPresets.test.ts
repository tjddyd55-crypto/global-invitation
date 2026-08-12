import assert from 'node:assert/strict';
import test from 'node:test';
import {
  JCI_CREED_SONG_2_ASSET,
  JCI_CREED_SONG_ASSET,
  ORGANIZATION_PRESETS,
  getOrganizationPreset,
  listOrganizationPresets,
} from './organizationPresets';
import { ORGANIZATION_SAMPLE_LOGO } from '@/src/templates/visualTemplate/templateSampleAssets';
import { DEFAULT_BRAND_ACCENT_COLOR } from './conceptTypes';

test('organization presets registry exposes CUSTOM and JCI', () => {
  const list = listOrganizationPresets();
  assert.equal(list.length, 2);
  assert.equal(list[0].id, 'CUSTOM');
  assert.equal(list[1].id, 'JCI');
  assert.equal(ORGANIZATION_PRESETS.CUSTOM.logoKey, null);
  assert.equal(ORGANIZATION_PRESETS.CUSTOM.defaultMusic, null);
  assert.equal(getOrganizationPreset('JCI').logoKey, ORGANIZATION_SAMPLE_LOGO);
  assert.equal(getOrganizationPreset('JCI').defaultMusic?.logicalId, 'JCI_CREED_SONG');
  assert.deepEqual(
    getOrganizationPreset('JCI').recommendedMusic.map((t) => t.logicalId),
    ['JCI_CREED_SONG', 'JCI_CREED_SONG_2']
  );
  assert.equal(JCI_CREED_SONG_ASSET.trackId, '7e718468-fe68-4903-8cda-3a7ab613483b');
  assert.equal(JCI_CREED_SONG_2_ASSET.logicalId, 'JCI_CREED_SONG_2');
  assert.ok(ORGANIZATION_SAMPLE_LOGO.startsWith('invitation/shared/images/templates/'));
  assert.equal(DEFAULT_BRAND_ACCENT_COLOR, '#0B1F3A');
});
