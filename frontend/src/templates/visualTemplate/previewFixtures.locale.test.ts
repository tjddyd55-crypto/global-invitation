import assert from 'node:assert/strict';
import test from 'node:test';
import { getVisualTemplatePreviewFixture } from './previewFixtures';

test('preview fixtures keep template IDs and switch sample content by locale', () => {
  const ko = getVisualTemplatePreviewFixture('GENERAL_05_FESTIVE', 'ko-KR');
  const en = getVisualTemplatePreviewFixture('GENERAL_05_FESTIVE', 'en-US');
  assert.equal(ko.visualTemplateId, 'GENERAL_05_FESTIVE');
  assert.equal(en.visualTemplateId, 'GENERAL_05_FESTIVE');
  assert.equal(ko.locale, 'ko-KR');
  assert.equal(en.locale, 'en-US');
  assert.match(String(ko.title), /무무/);
  assert.match(String(en.title), /Mumu Market Night/i);
});

test('wedding and organization english fixtures use english sample names', () => {
  const wedding = getVisualTemplatePreviewFixture('WEDDING_05_GARDEN', 'en-US');
  assert.match(String(wedding.groomName), /Daniel/i);
  assert.match(String(wedding.brideName), /Emma/i);

  const org = getVisualTemplatePreviewFixture('ORGANIZATION_02_JCI', 'en-US');
  assert.match(String(org.title), /Inauguration/i);
  assert.equal(org.organization?.name, 'JCI Seoul Gwangjin');
});
