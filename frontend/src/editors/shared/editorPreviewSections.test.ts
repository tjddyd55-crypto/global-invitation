/**
 * Unit: editor step → preview section mapping.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveEditorPreviewSectionId } from './editorPreviewSections';

test('wedding step mapping covers music and share', () => {
  assert.equal(resolveEditorPreviewSectionId('setup', 'WEDDING'), 'hero');
  assert.equal(resolveEditorPreviewSectionId('message', 'WEDDING'), 'greeting');
  assert.equal(resolveEditorPreviewSectionId('hero', 'WEDDING'), 'hero');
  assert.equal(resolveEditorPreviewSectionId('couple', 'WEDDING'), 'couple');
  assert.equal(resolveEditorPreviewSectionId('gallery', 'WEDDING'), 'gallery');
  assert.equal(resolveEditorPreviewSectionId('location', 'WEDDING'), 'location');
  assert.equal(resolveEditorPreviewSectionId('accounts', 'WEDDING'), 'accounts');
  assert.equal(resolveEditorPreviewSectionId('rsvp', 'WEDDING'), 'rsvp');
  assert.equal(resolveEditorPreviewSectionId('music', 'WEDDING'), 'music');
  assert.equal(resolveEditorPreviewSectionId('share', 'WEDDING'), 'share');
});

test('funeral couple maps to deceased and music to music', () => {
  assert.equal(resolveEditorPreviewSectionId('couple', 'FUNERAL'), 'deceased');
  assert.equal(resolveEditorPreviewSectionId('schedule', 'FUNERAL'), 'schedule');
  assert.equal(resolveEditorPreviewSectionId('music', 'FUNERAL'), 'music');
  assert.equal(resolveEditorPreviewSectionId('share', 'FUNERAL'), 'share');
});

test('general maps schedule, greeting, music', () => {
  assert.equal(resolveEditorPreviewSectionId('schedule', 'GENERAL'), 'schedule');
  assert.equal(resolveEditorPreviewSectionId('message', 'GENERAL'), 'greeting');
  assert.equal(resolveEditorPreviewSectionId('music', 'GENERAL'), 'music');
  assert.equal(resolveEditorPreviewSectionId('share', 'GENERAL'), 'share');
});
