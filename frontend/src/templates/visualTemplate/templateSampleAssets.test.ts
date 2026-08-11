import assert from 'node:assert/strict';
import test from 'node:test';
import { isSharedInvitationAssetUrlOrKey } from '@/src/invitation/galleryAsset';
import { getVisualTemplatePreviewFixture } from './previewFixtures';
import {
  ORGANIZATION_SAMPLE_LOGO,
  ORGANIZATION_SAMPLE_PHOTOS,
  templateHeroAsset,
  templateOrganizationLogoAsset,
} from './templateSampleAssets';

test('ORGANIZATION sample logo resolves to shared template key', () => {
  assert.equal(
    ORGANIZATION_SAMPLE_LOGO,
    'invitation/shared/images/templates/ORGANIZATION_01_OFFICIAL/logo.webp'
  );
  assert.equal(
    templateOrganizationLogoAsset('ORGANIZATION_01_OFFICIAL'),
    ORGANIZATION_SAMPLE_LOGO
  );
  assert.equal(templateOrganizationLogoAsset('WEDDING_05_GARDEN'), undefined);
});

test('ORGANIZATION preview fixture includes logo and keeps gallery photos', () => {
  const fixture = getVisualTemplatePreviewFixture('ORGANIZATION_01_OFFICIAL');
  assert.equal(fixture.conceptType, 'ORGANIZATION');
  assert.equal(fixture.visualTemplateId, 'ORGANIZATION_01_OFFICIAL');
  assert.equal(fixture.organization?.name, '서울광진청년회의소');
  assert.equal(fixture.organization?.englishName, 'JCI Seoul Gwangjin');
  assert.equal(
    fixture.organization?.englishFullName,
    'Junior Chamber International Seoul Gwangjin'
  );
  assert.equal(fixture.organization?.logo, ORGANIZATION_SAMPLE_LOGO);
  assert.ok(fixture.heroImage);
  assert.equal(fixture.heroImage, templateHeroAsset('ORGANIZATION_01_OFFICIAL'));
  assert.ok((fixture.galleryImages?.length ?? 0) >= 9);
  assert.equal(fixture.galleryImages?.[0], templateHeroAsset('ORGANIZATION_01_OFFICIAL'));
  assert.ok(ORGANIZATION_SAMPLE_PHOTOS.every((key) => fixture.galleryImages?.includes(key)));
  assert.equal(fixture.rsvpEnabled, true);
  assert.ok((fixture.accounts?.length ?? 0) >= 1);
});

test('ORGANIZATION sample logo key is shared-cleanup protected', () => {
  assert.equal(isSharedInvitationAssetUrlOrKey('', ORGANIZATION_SAMPLE_LOGO), true);
  assert.equal(
    isSharedInvitationAssetUrlOrKey(
      `https://cdn.example.com/${ORGANIZATION_SAMPLE_LOGO}`,
      ORGANIZATION_SAMPLE_LOGO
    ),
    true
  );
});

test('Wedding preview fixture still resolves without organization logo', () => {
  const fixture = getVisualTemplatePreviewFixture('WEDDING_05_GARDEN');
  assert.equal(fixture.conceptType, 'WEDDING');
  assert.ok(fixture.heroImage);
  assert.ok((fixture.galleryImages?.length ?? 0) >= 9);
  assert.equal(fixture.organization?.logo, undefined);
});
