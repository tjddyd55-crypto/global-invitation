/**
 * Concept별 editor visible steps + preview section mapping.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveEditorPreviewSectionId,
  PREVIEW_SECTION_SCROLL_OFFSET,
} from './editorPreviewSections';
import { resolveVisibleSections } from '../wedding/state/editorSteps';

test('GENERAL setup maps to basic (not hero)', () => {
  assert.equal(resolveEditorPreviewSectionId('setup', 'GENERAL'), 'basic');
  assert.equal(resolveEditorPreviewSectionId('hero', 'GENERAL'), 'hero');
});

test('GENERAL has 9 editor steps without schedule menu', () => {
  const steps = resolveVisibleSections('GENERAL');
  assert.equal(steps.length, 9);
  assert.deepEqual(
    steps.map((s) => s.key),
    ['setup', 'message', 'hero', 'gallery', 'location', 'accounts', 'rsvp', 'music', 'share']
  );
  assert.ok(!steps.some((s) => s.key === 'schedule'));
  assert.equal(steps[2]?.key, 'hero');
  assert.equal(steps[3]?.key, 'gallery');
});

test('GENERAL message/gallery/accounts mapping; schedule key falls back to basic', () => {
  assert.equal(resolveEditorPreviewSectionId('message', 'GENERAL'), 'greeting');
  assert.equal(resolveEditorPreviewSectionId('schedule', 'GENERAL'), 'basic');
  assert.equal(resolveEditorPreviewSectionId('gallery', 'GENERAL'), 'gallery');
  assert.equal(resolveEditorPreviewSectionId('location', 'GENERAL'), 'location');
  assert.equal(resolveEditorPreviewSectionId('accounts', 'GENERAL'), 'accounts');
  assert.equal(resolveEditorPreviewSectionId('rsvp', 'GENERAL'), 'rsvp');
  assert.equal(resolveEditorPreviewSectionId('music', 'GENERAL'), 'music');
  assert.equal(resolveEditorPreviewSectionId('share', 'GENERAL'), 'share');
});

test('WEDDING keeps 10 steps including couple (no schedule editor step)', () => {
  const steps = resolveVisibleSections('WEDDING');
  assert.equal(steps.length, 10);
  assert.ok(steps.some((s) => s.key === 'couple'));
  assert.ok(!steps.some((s) => s.key === 'schedule'));
  assert.equal(resolveEditorPreviewSectionId('setup', 'WEDDING'), 'hero');
  assert.equal(resolveEditorPreviewSectionId('couple', 'WEDDING'), 'couple');
});

test('FUNERAL keeps schedule editor step', () => {
  const steps = resolveVisibleSections('FUNERAL');
  assert.equal(steps.length, 10);
  assert.ok(steps.some((s) => s.key === 'schedule' && s.title === '장례 일정'));
});

test('scroll offset SSOT is stable', () => {
  assert.equal(PREVIEW_SECTION_SCROLL_OFFSET, 12);
});
