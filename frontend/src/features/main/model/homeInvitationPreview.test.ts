import assert from 'node:assert/strict';
import test from 'node:test';
import { isFuneralInvitationData, isWeddingInvitationData } from '@/src/invitation/schemas';
import {
  getHomeInvitationExampleData,
  getHomeInvitationPreviewData,
  HOME_PREVIEW_PATH,
  HOME_PREVIEW_TEMPLATE_ID,
  listHomeInvitationExamples,
} from './homeInvitationPreview';

test('home examples SSOT covers all four concepts', () => {
  const examples = listHomeInvitationExamples();
  assert.deepEqual(
    examples.map((item) => item.concept),
    ['WEDDING', 'FUNERAL', 'GENERAL', 'ORGANIZATION']
  );
  assert.equal(examples.length, 4);
  assert.equal(examples[0]?.visualTemplateId, 'WEDDING_05_GARDEN');
  assert.equal(examples[2]?.visualTemplateId, 'GENERAL_05_FESTIVE');
  assert.equal(examples[2]?.href, '/templates/GENERAL_05_FESTIVE/preview');
  assert.equal(examples[2]?.label, '일반 행사');
  assert.equal(examples[3]?.visualTemplateId, 'ORGANIZATION_02_JCI');
});

test('general home example uses festive fixture without map or gallery weight', () => {
  const data = getHomeInvitationExampleData('general');
  assert.ok(isWeddingInvitationData(data));
  assert.equal(data.conceptType, 'GENERAL');
  assert.equal(data.visualTemplateId, 'GENERAL_05_FESTIVE');
  assert.ok(data.heroImage);
  assert.equal(data.galleryImages?.length, 0);
  assert.equal(data.mapLat, undefined);
});

test('home preview reuses Garden fixture without map or gallery weight', () => {
  assert.equal(HOME_PREVIEW_TEMPLATE_ID, 'WEDDING_05_GARDEN');
  assert.equal(HOME_PREVIEW_PATH, '/templates/WEDDING_05_GARDEN/preview');

  const data = getHomeInvitationPreviewData();
  assert.equal(data.visualTemplateId, 'WEDDING_05_GARDEN');
  assert.equal(data.conceptType, 'WEDDING');
  assert.ok(data.heroImage);
  assert.equal(data.galleryImages?.length, 0);
  assert.equal(data.mapLat, undefined);
});

test('organization home example uses JCI fixture without map weight', () => {
  const data = getHomeInvitationExampleData('organization');
  assert.ok(isWeddingInvitationData(data));
  assert.equal(data.conceptType, 'ORGANIZATION');
  assert.equal(data.visualTemplateId, 'ORGANIZATION_02_JCI');
  assert.equal(data.galleryImages?.length, 0);
});

test('funeral home example keeps classic demo without map', () => {
  const data = getHomeInvitationExampleData('funeral');
  assert.ok(isFuneralInvitationData(data));
  assert.ok(data.deceasedName);
  assert.equal(data.funeralHall.address, undefined);
});
