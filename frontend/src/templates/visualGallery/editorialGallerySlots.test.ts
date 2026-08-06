/**
 * Editorial GRID_EXPAND slot / object-fit unit tests.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeImageAspectRatio,
  getEditorialGallerySlot,
  isEditorialLastSingleOrphan,
  resolveEditorialGalleryObjectFit,
  resolveEditorialGallerySlot,
} from './editorialGallerySlots';

test('index 0 → WIDE', () => {
  assert.equal(getEditorialGallerySlot(0), 'WIDE');
});

test('index 1/2 → paired portrait', () => {
  assert.equal(getEditorialGallerySlot(1), 'PORTRAIT_LEFT');
  assert.equal(getEditorialGallerySlot(2), 'PORTRAIT_RIGHT');
});

test('index 3/4 → second pair', () => {
  assert.equal(getEditorialGallerySlot(3), 'TALL_LEFT');
  assert.equal(getEditorialGallerySlot(4), 'MEDIUM_RIGHT');
});

test('index 5 → wide secondary', () => {
  assert.equal(getEditorialGallerySlot(5), 'WIDE_SECONDARY');
});

test('pattern repeats', () => {
  assert.equal(getEditorialGallerySlot(6), 'WIDE');
  assert.equal(getEditorialGallerySlot(7), 'PORTRAIT_LEFT');
  assert.equal(getEditorialGallerySlot(11), 'WIDE_SECONDARY');
});

test('1장 → WIDE', () => {
  assert.equal(resolveEditorialGallerySlot(0, 1), 'WIDE');
});

test('2장 → WIDE + WIDE_SECONDARY', () => {
  assert.equal(resolveEditorialGallerySlot(0, 2), 'WIDE');
  assert.equal(resolveEditorialGallerySlot(1, 2), 'WIDE_SECONDARY');
});

test('3장 → wide + portrait pair', () => {
  assert.deepEqual(
    [0, 1, 2].map((i) => resolveEditorialGallerySlot(i, 3)),
    ['WIDE', 'PORTRAIT_LEFT', 'PORTRAIT_RIGHT']
  );
});

test('4장 → wide + pair + wide', () => {
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => resolveEditorialGallerySlot(i, 4)),
    ['WIDE', 'PORTRAIT_LEFT', 'PORTRAIT_RIGHT', 'WIDE_SECONDARY']
  );
});

test('5장 → wide + two pairs', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((i) => resolveEditorialGallerySlot(i, 5)),
    ['WIDE', 'PORTRAIT_LEFT', 'PORTRAIT_RIGHT', 'TALL_LEFT', 'MEDIUM_RIGHT']
  );
});

test('9장 layout pattern closes without orphan', () => {
  const slots = Array.from({ length: 9 }, (_, i) => resolveEditorialGallerySlot(i, 9));
  assert.equal(slots[0], 'WIDE');
  assert.equal(slots[5], 'WIDE_SECONDARY');
  assert.equal(slots[6], 'WIDE');
  assert.equal(slots[7], 'PORTRAIT_LEFT');
  assert.equal(slots[8], 'PORTRAIT_RIGHT');
  assert.equal(isEditorialLastSingleOrphan(8, 9), false);
});

test('10장 initial 9 (collapsed pool) matches 9-count layout', () => {
  const slots = Array.from({ length: 9 }, (_, i) => resolveEditorialGallerySlot(i, 9));
  assert.equal(slots.length, 9);
  assert.equal(slots[8], 'PORTRAIT_RIGHT');
});

test('10장 expanded: last orphan LEFT → full-width', () => {
  const slots = Array.from({ length: 10 }, (_, i) => resolveEditorialGallerySlot(i, 10));
  assert.equal(slots[8], 'PORTRAIT_RIGHT');
  assert.equal(isEditorialLastSingleOrphan(9, 10), true);
  assert.equal(slots[9], 'WIDE_SECONDARY');
});

test('18장 pattern stable', () => {
  const slots = Array.from({ length: 18 }, (_, i) => resolveEditorialGallerySlot(i, 18));
  assert.equal(slots[0], 'WIDE');
  assert.equal(slots[17], 'WIDE_SECONDARY');
  assert.equal(slots[16], 'MEDIUM_RIGHT');
});

test('마지막 single orphan → full-width', () => {
  assert.equal(isEditorialLastSingleOrphan(7, 8), true);
  assert.equal(resolveEditorialGallerySlot(7, 8), 'WIDE_SECONDARY');
});

test('normal photo → cover', () => {
  assert.equal(resolveEditorialGalleryObjectFit(4 / 3), 'cover');
  assert.equal(resolveEditorialGalleryObjectFit(3 / 4), 'cover');
  assert.equal(resolveEditorialGalleryObjectFit(1), 'cover');
});

test('extreme portrait → contain', () => {
  assert.equal(resolveEditorialGalleryObjectFit(0.5), 'contain');
  assert.equal(resolveEditorialGalleryObjectFit(0.64), 'contain');
});

test('extreme landscape → contain', () => {
  assert.equal(resolveEditorialGalleryObjectFit(2), 'contain');
  assert.equal(resolveEditorialGalleryObjectFit(2.5), 'contain');
});

test('invalid ratio → cover', () => {
  assert.equal(resolveEditorialGalleryObjectFit(null), 'cover');
  assert.equal(resolveEditorialGalleryObjectFit(0), 'cover');
  assert.equal(resolveEditorialGalleryObjectFit(-1), 'cover');
});

test('computeImageAspectRatio', () => {
  assert.equal(computeImageAspectRatio(800, 600), 800 / 600);
  assert.equal(computeImageAspectRatio(0, 100), null);
});
