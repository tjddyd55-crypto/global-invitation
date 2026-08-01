/**
 * Unit checks for gallery display mode selector.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GALLERY_GRID_INITIAL_VISIBLE_COUNT,
  getInvitationGallerySettings,
  normalizeGalleryDisplayMode,
} from './galleryDisplay';

test('missing mode defaults to SLIDE', () => {
  assert.equal(normalizeGalleryDisplayMode(undefined), 'SLIDE');
  assert.equal(normalizeGalleryDisplayMode(null), 'SLIDE');
  assert.equal(normalizeGalleryDisplayMode('oops'), 'SLIDE');
});

test('valid modes pass through', () => {
  assert.equal(normalizeGalleryDisplayMode('SLIDE'), 'SLIDE');
  assert.equal(normalizeGalleryDisplayMode('GRID_EXPAND'), 'GRID_EXPAND');
});

test('settings: empty images', () => {
  const settings = getInvitationGallerySettings({ galleryImages: [], galleryDisplayMode: 'GRID_EXPAND' });
  assert.equal(settings.images.length, 0);
  assert.equal(settings.displayMode, 'GRID_EXPAND');
  assert.equal(settings.canExpand, false);
  assert.equal(settings.initialVisibleCount, GALLERY_GRID_INITIAL_VISIBLE_COUNT);
});

test('settings: 9 images GRID_EXPAND does not expand', () => {
  const galleryImages = Array.from({ length: 9 }, (_, i) => `https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/${i}.jpg`);
  const settings = getInvitationGallerySettings({ galleryImages, galleryDisplayMode: 'GRID_EXPAND' });
  assert.equal(settings.images.length, 9);
  assert.equal(settings.canExpand, false);
});

test('settings: 10 images GRID_EXPAND can expand', () => {
  const galleryImages = Array.from({ length: 10 }, (_, i) => `https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/${i}.jpg`);
  const settings = getInvitationGallerySettings({ galleryImages, galleryDisplayMode: 'GRID_EXPAND' });
  assert.equal(settings.images.length, 10);
  assert.equal(settings.canExpand, true);
  assert.equal(settings.initialVisibleCount, 9);
});

test('settings: SLIDE never expands', () => {
  const galleryImages = Array.from({ length: 12 }, (_, i) => `https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/${i}.jpg`);
  const settings = getInvitationGallerySettings({ galleryImages, galleryDisplayMode: 'SLIDE' });
  assert.equal(settings.canExpand, false);
});
