import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getHomeInvitationPreviewData,
  HOME_PREVIEW_PATH,
  HOME_PREVIEW_TEMPLATE_ID,
} from './homeInvitationPreview';

test('home preview reuses Garden fixture without map or gallery weight', () => {
  assert.equal(HOME_PREVIEW_TEMPLATE_ID, 'WEDDING_05_GARDEN');
  assert.equal(HOME_PREVIEW_PATH, '/templates/WEDDING_05_GARDEN/preview');

  const data = getHomeInvitationPreviewData();
  assert.equal(data.visualTemplateId, 'WEDDING_05_GARDEN');
  assert.equal(data.conceptType, 'WEDDING');
  assert.ok(data.heroImage);
  assert.ok(data.groomName);
  assert.ok(data.brideName);
  assert.equal(data.galleryImages?.length, 0);
  assert.equal(data.mapLat, undefined);
  assert.equal(data.mapLng, undefined);
  assert.equal(data.accountEnabled, false);
  assert.equal(data.rsvpEnabled, true);
});
