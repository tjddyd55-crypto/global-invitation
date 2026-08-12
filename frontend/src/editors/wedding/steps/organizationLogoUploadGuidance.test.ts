import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getOrganizationLogoUploadGuidance,
  ORGANIZATION_LOGO_RECOMMENDED_MIN_WIDTH_PX,
} from './organizationLogoUploadGuidance';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  formatAllowedImageFormatsLabel,
  formatMaxImageSizeLabel,
  MAX_IMAGE_SIZE_BYTES,
} from '@/src/lib/mediaApi';

test('organization logo guidance matches mediaApi MIME and max size', () => {
  const guidance = getOrganizationLogoUploadGuidance();
  assert.equal(ORGANIZATION_LOGO_RECOMMENDED_MIN_WIDTH_PX, 1200);
  assert.match(guidance.primary, /1200px/);
  assert.match(guidance.primary, /투명 배경/);
  assert.doesNotMatch(guidance.primary, /정사각|3:1|1200\s*[×x]\s*400/);
  assert.equal(
    guidance.primary.includes(formatAllowedImageFormatsLabel(ALLOWED_IMAGE_MIME_TYPES)),
    true
  );
  assert.equal(guidance.secondary.includes(formatMaxImageSizeLabel(MAX_IMAGE_SIZE_BYTES)), true);
  assert.match(guidance.secondary, /원본 비율/);
  assert.deepEqual([...ALLOWED_IMAGE_MIME_TYPES], ['image/jpeg', 'image/png', 'image/webp']);
  assert.equal(MAX_IMAGE_SIZE_BYTES, 10 * 1024 * 1024);
});
