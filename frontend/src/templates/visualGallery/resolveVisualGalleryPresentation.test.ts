/**
 * Resolver: visualTemplateId + galleryDisplayMode → presentation.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPreviewFixtureGalleryMode,
  resolveVisualGalleryPresentation,
} from './resolveVisualGalleryPresentation';

test('invalid mode → SLIDE fallback', () => {
  const resolved = resolveVisualGalleryPresentation('WEDDING_04_EDITORIAL', 'NOPE');
  assert.equal(resolved.displayMode, 'SLIDE');
  assert.equal(resolved.presentation, 'editorial');
});

test('Classic + SLIDE / GRID_EXPAND uses shared', () => {
  const slide = resolveVisualGalleryPresentation('WEDDING_01_CLASSIC', 'SLIDE');
  assert.equal(slide.usesClassicShared, true);
  assert.equal(slide.presentation, 'classic');
  const grid = resolveVisualGalleryPresentation('GENERAL_01_CLASSIC', 'GRID_EXPAND');
  assert.equal(grid.usesClassicShared, true);
  assert.equal(grid.displayMode, 'GRID_EXPAND');
});

const NEW_TEMPLATES = [
  ['WEDDING_04_EDITORIAL', 'editorial'],
  ['WEDDING_05_GARDEN', 'garden'],
  ['WEDDING_06_NIGHT', 'night'],
  ['GENERAL_04_CLEAN', 'clean'],
  ['GENERAL_05_FESTIVE', 'festive'],
  ['GENERAL_06_CULTURE', 'culture'],
  ['ORGANIZATION_01_OFFICIAL', 'official'],
] as const;

for (const [id, presentation] of NEW_TEMPLATES) {
  test(`${id} + GRID_EXPAND → ${presentation}`, () => {
    const resolved = resolveVisualGalleryPresentation(id, 'GRID_EXPAND');
    assert.equal(resolved.presentation, presentation);
    assert.equal(resolved.displayMode, 'GRID_EXPAND');
    assert.equal(resolved.usesClassicShared, false);
  });

  test(`${id} + SLIDE → ${presentation}`, () => {
    const resolved = resolveVisualGalleryPresentation(id, 'SLIDE');
    assert.equal(resolved.presentation, presentation);
    assert.equal(resolved.displayMode, 'SLIDE');
  });
}

test('unknown visualTemplateId falls back to classic shared', () => {
  const resolved = resolveVisualGalleryPresentation('UNKNOWN', 'GRID_EXPAND');
  assert.equal(resolved.presentation, 'classic');
  assert.equal(resolved.usesClassicShared, true);
});

test('template change keeps mode (resolver is pure)', () => {
  const mode = 'GRID_EXPAND' as const;
  const before = resolveVisualGalleryPresentation('WEDDING_04_EDITORIAL', mode);
  const after = resolveVisualGalleryPresentation('WEDDING_05_GARDEN', mode);
  assert.equal(before.displayMode, after.displayMode);
  assert.notEqual(before.presentation, after.presentation);
});

test('preview fixture modes', () => {
  assert.equal(getPreviewFixtureGalleryMode('WEDDING_04_EDITORIAL'), 'GRID_EXPAND');
  assert.equal(getPreviewFixtureGalleryMode('WEDDING_05_GARDEN'), 'GRID_EXPAND');
  assert.equal(getPreviewFixtureGalleryMode('WEDDING_06_NIGHT'), 'SLIDE');
  assert.equal(getPreviewFixtureGalleryMode('GENERAL_04_CLEAN'), 'GRID_EXPAND');
  assert.equal(getPreviewFixtureGalleryMode('GENERAL_05_FESTIVE'), 'GRID_EXPAND');
  assert.equal(getPreviewFixtureGalleryMode('GENERAL_06_CULTURE'), 'SLIDE');
  assert.equal(getPreviewFixtureGalleryMode('WEDDING_01_CLASSIC'), 'GRID_EXPAND');
  assert.equal(getPreviewFixtureGalleryMode('GENERAL_01_CLASSIC'), 'SLIDE');
  assert.equal(getPreviewFixtureGalleryMode('ORGANIZATION_01_OFFICIAL'), 'GRID_EXPAND');
});
