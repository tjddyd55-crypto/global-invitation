/**
 * GENERAL editor step → preview section mapping + schedule dedupe helpers.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveEditorPreviewSectionId,
  PREVIEW_SECTION_SCROLL_OFFSET,
} from './editorPreviewSections';

test('GENERAL setup maps to basic (not hero)', () => {
  assert.equal(resolveEditorPreviewSectionId('setup', 'GENERAL'), 'basic');
  assert.equal(resolveEditorPreviewSectionId('hero', 'GENERAL'), 'hero');
});

test('GENERAL message/schedule/accounts/rsvp/music/share mapping', () => {
  assert.equal(resolveEditorPreviewSectionId('message', 'GENERAL'), 'greeting');
  assert.equal(resolveEditorPreviewSectionId('schedule', 'GENERAL'), 'schedule');
  assert.equal(resolveEditorPreviewSectionId('gallery', 'GENERAL'), 'gallery');
  assert.equal(resolveEditorPreviewSectionId('location', 'GENERAL'), 'location');
  assert.equal(resolveEditorPreviewSectionId('accounts', 'GENERAL'), 'accounts');
  assert.equal(resolveEditorPreviewSectionId('rsvp', 'GENERAL'), 'rsvp');
  assert.equal(resolveEditorPreviewSectionId('music', 'GENERAL'), 'music');
  assert.equal(resolveEditorPreviewSectionId('share', 'GENERAL'), 'share');
});

test('WEDDING setup still maps to hero (no regression)', () => {
  assert.equal(resolveEditorPreviewSectionId('setup', 'WEDDING'), 'hero');
  assert.equal(resolveEditorPreviewSectionId('couple', 'WEDDING'), 'couple');
});

test('scroll offset SSOT is stable', () => {
  assert.equal(PREVIEW_SECTION_SCROLL_OFFSET, 12);
});
