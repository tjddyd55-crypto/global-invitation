/**
 * Unit: editor step SSOT — music before share (10 steps).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveVisibleSections } from './editorSteps';

test('wedding has 10 steps with music then share', () => {
  const steps = resolveVisibleSections('WEDDING');
  assert.equal(steps.length, 10);
  assert.equal(steps[7]?.key, 'rsvp');
  assert.equal(steps[7]?.title, '참석 여부');
  assert.equal(steps[8]?.key, 'music');
  assert.equal(steps[8]?.title, '음악 설정');
  assert.equal(steps[9]?.key, 'share');
  assert.equal(steps[9]?.title, '공유 설정');
});

test('general has 10 steps with music then share', () => {
  const steps = resolveVisibleSections('GENERAL');
  assert.equal(steps.length, 10);
  assert.equal(steps[8]?.key, 'music');
  assert.equal(steps[9]?.key, 'share');
});

test('funeral has 10 steps with music then share', () => {
  const steps = resolveVisibleSections('FUNERAL');
  assert.equal(steps.length, 10);
  assert.equal(steps[8]?.key, 'music');
  assert.equal(steps[9]?.key, 'share');
});
