import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrganizationLogoUploadGuidance } from './organizationLogoUploadGuidance';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  formatAllowedImageFormatsLabel,
  formatMaxImageSizeLabel,
  MAX_IMAGE_SIZE_BYTES,
} from '@/src/lib/mediaApi';

test('organization logo guidance matches mediaApi MIME and max size', () => {
  const guidance = getOrganizationLogoUploadGuidance();
  assert.match(guidance.primary, /투명 배경/);
  assert.match(guidance.primary, /가로형|정사각형|세로형/);
  assert.doesNotMatch(guidance.primary, /3:1|1200\s*[×x]\s*400|필수/);
  assert.equal(
    guidance.primary.includes(formatAllowedImageFormatsLabel(ALLOWED_IMAGE_MIME_TYPES)),
    true
  );
  assert.equal(guidance.secondary.includes(formatMaxImageSizeLabel(MAX_IMAGE_SIZE_BYTES)), true);
  assert.match(guidance.secondary, /고해상도|최대/);
  assert.deepEqual([...ALLOWED_IMAGE_MIME_TYPES], ['image/jpeg', 'image/png', 'image/webp']);
  assert.equal(MAX_IMAGE_SIZE_BYTES, 10 * 1024 * 1024);
});
