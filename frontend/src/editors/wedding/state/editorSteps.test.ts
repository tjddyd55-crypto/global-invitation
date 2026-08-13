/**
 * Unit: editor step SSOT — music before share (10 steps).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveVisibleSections } from './editorSteps';

test('wedding has 10 steps with music then share', () => {
  const steps = resolveVisibleSections('WEDDING', 'ko-KR');
  assert.equal(steps.length, 10);
  assert.equal(steps[7]?.key, 'rsvp');
  assert.equal(steps[7]?.title, '참석 여부');
  assert.equal(steps[8]?.key, 'music');
  assert.equal(steps[8]?.title, '음악 설정');
  assert.equal(steps[9]?.key, 'share');
  assert.equal(steps[9]?.title, '공유 설정');
});

test('english wedding steps are localized', () => {
  const steps = resolveVisibleSections('WEDDING', 'en-US');
  assert.equal(steps[0]?.title, 'Basic Info');
  assert.equal(steps[7]?.title, 'RSVP');
  assert.equal(steps[8]?.title, 'Music');
});

test('general has 9 steps without schedule; music then share', () => {
  const steps = resolveVisibleSections('GENERAL');
  assert.equal(steps.length, 9);
  assert.ok(!steps.some((s) => s.key === 'schedule'));
  assert.equal(steps[2]?.key, 'hero');
  assert.equal(steps[3]?.key, 'gallery');
  assert.equal(steps[7]?.key, 'music');
  assert.equal(steps[8]?.key, 'share');
});

test('funeral has 10 steps with music then share', () => {
  const steps = resolveVisibleSections('FUNERAL');
  assert.equal(steps.length, 10);
  assert.equal(steps[8]?.key, 'music');
  assert.equal(steps[9]?.key, 'share');
});

test('organization has 10 steps with branding first then music/share', () => {
  const steps = resolveVisibleSections('ORGANIZATION', 'ko-KR');
  assert.equal(steps.length, 10);
  assert.equal(steps[0]?.key, 'organization');
  assert.equal(steps[0]?.title, '기관 브랜딩');
  assert.equal(steps[0]?.previewSectionId, 'organization');
  assert.equal(steps[1]?.key, 'setup');
  assert.equal(steps[1]?.title, '기본 정보');
  assert.ok(!steps.some((s) => s.key === 'couple'));
  assert.ok(!steps.some((s) => s.key === 'schedule'));
  assert.equal(steps[8]?.key, 'music');
  assert.equal(steps[9]?.key, 'share');
});
