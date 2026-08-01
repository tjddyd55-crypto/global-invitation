/**
 * Unit checks for gallery asset classification / sanitizer.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyGalleryAssetSource,
  isDemoGalleryAsset,
  isUserInvitationAsset,
  keepUserUploadGalleryItems,
  sanitizeGalleryItems,
  shouldDeleteRemoteGalleryAsset,
} from './galleryAsset';

test('demo classic gallery paths are placeholders', () => {
  assert.equal(isDemoGalleryAsset('/images/wedding/classic/gallery_01.jpg'), true);
  assert.equal(classifyGalleryAssetSource({ url: '/images/wedding/classic/gallery_03.jpg' }), 'PLACEHOLDER');
  assert.equal(shouldDeleteRemoteGalleryAsset({ url: '/images/wedding/classic/gallery_03.jpg' }), false);
});

test('canonical user R2 paths are USER_UPLOAD', () => {
  const url =
    'https://cdn.example.com/invitation/development/users/u1/invitations/i1/gallery/abc.jpg';
  assert.equal(isUserInvitationAsset(url), true);
  assert.equal(classifyGalleryAssetSource({ url }), 'USER_UPLOAD');
  assert.equal(shouldDeleteRemoteGalleryAsset({ url, objectKey: 'invitation/development/users/u1/invitations/i1/gallery/abc.jpg' }), true);
});

test('obsolete wrong-order user R2 paths are not treated as USER_UPLOAD', () => {
  const url = 'https://cdn.example.com/development/invitation/users/u1/invitations/i1/gallery/abc.jpg';
  assert.equal(isUserInvitationAsset(url), false);
  assert.equal(classifyGalleryAssetSource({ url }), 'LEGACY');
});

test('shared catalog is SHARED and not remotely deletable by user flow', () => {
  const url = 'https://cdn.example.com/invitation/shared/images/wedding/floral.webp';
  assert.equal(classifyGalleryAssetSource({ url }), 'SHARED');
  assert.equal(shouldDeleteRemoteGalleryAsset({ url }), false);
});

test('18 demo + 3 user sanitizes to 3', () => {
  const demos = Array.from({ length: 18 }, (_, i) => ({
    url: `/images/wedding/classic/gallery_${String((i % 12) + 1).padStart(2, '0')}.jpg`,
  }));
  const users = [
    { url: 'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/a.jpg', objectKey: 'invitation/development/users/u/invitations/i/gallery/a.jpg' },
    { url: 'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/b.jpg', objectKey: 'invitation/development/users/u/invitations/i/gallery/b.jpg' },
    { url: 'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/c.jpg', objectKey: 'invitation/development/users/u/invitations/i/gallery/c.jpg' },
  ];
  const sanitized = sanitizeGalleryItems([...demos, ...users]);
  assert.equal(sanitized.length, 3);
  assert.ok(sanitized.every((item) => item.source === 'USER_UPLOAD'));
});

test('first upload keepUserUpload strips demos', () => {
  const current = [
    { url: '/images/wedding/classic/gallery_01.jpg' },
    { url: 'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/a.jpg', objectKey: 'invitation/development/users/u/invitations/i/gallery/a.jpg' },
  ];
  assert.equal(keepUserUploadGalleryItems(current).length, 1);
});

test('isSharedInvitationAsset alias', () => {
  assert.equal(
    classifyGalleryAssetSource({
      url: 'https://cdn.example.com/invitation/shared/images/wedding/floral.webp',
    }),
    'SHARED'
  );
});

test('empty url items removed', () => {
  assert.equal(sanitizeGalleryItems([{ url: '' }, { url: '   ' }]).length, 0);
});

test('duplicate urls removed', () => {
  const url = 'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/a.jpg';
  const sanitized = sanitizeGalleryItems([{ url }, { url }]);
  assert.equal(sanitized.length, 1);
});
