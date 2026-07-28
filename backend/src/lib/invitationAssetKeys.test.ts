/**
 * Unit checks for invitation asset keys (canonical invitation/{env}/...).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

process.env.INVITATION_R2_ROOT_PREFIX = 'invitation';
process.env.INVITATION_ASSET_ENVIRONMENT = 'development';
process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';
// Must NOT affect invitation user/shared/temp builders
process.env.R2_KEY_PREFIX = 'development';

import {
  buildInvitationAssetKey,
  buildSharedAssetKey,
  buildInvitationTempKey,
  parseInvitationUserAssetKey,
  isSharedInvitationAssetKey,
  getInvitationAssetEnvironment,
} from './invitationAssetKeys';
import { parseMediaObjectKey } from './media/keys';

test('1. development hero key', () => {
  const key = buildInvitationAssetKey({
    userId: 'u1',
    invitationId: 'i1',
    assetType: 'hero',
    contentType: 'image/jpeg',
    fileId: 'f1',
  });
  assert.equal(key, 'invitation/development/users/u1/invitations/i1/hero/f1.jpg');
});

test('2. development gallery key', () => {
  const key = buildInvitationAssetKey({
    userId: 'u1',
    invitationId: 'i1',
    assetType: 'gallery',
    contentType: 'image/jpeg',
    fileId: 'f1',
  });
  assert.equal(key, 'invitation/development/users/u1/invitations/i1/gallery/f1.jpg');
});

test('3. development groom key', () => {
  const key = buildInvitationAssetKey({
    userId: 'u1',
    invitationId: 'i1',
    assetType: 'groom-profile',
    contentType: 'image/jpeg',
    fileId: 'f1',
  });
  assert.equal(key, 'invitation/development/users/u1/invitations/i1/couple/groom/f1.jpg');
});

test('4. development bride key', () => {
  const key = buildInvitationAssetKey({
    userId: 'u1',
    invitationId: 'i1',
    assetType: 'bride-profile',
    contentType: 'image/jpeg',
    fileId: 'f1',
  });
  assert.equal(key, 'invitation/development/users/u1/invitations/i1/couple/bride/f1.jpg');
});

test('5. development music key', () => {
  const key = buildInvitationAssetKey({
    userId: 'u1',
    invitationId: 'i1',
    assetType: 'user-music',
    contentType: 'audio/mpeg',
    fileId: 'f1',
  });
  assert.equal(key, 'invitation/development/users/u1/invitations/i1/music/f1.mp3');
});

test('6. production gallery key', () => {
  const previous = process.env.INVITATION_ASSET_ENVIRONMENT;
  process.env.INVITATION_ASSET_ENVIRONMENT = 'production';
  assert.equal(getInvitationAssetEnvironment(), 'production');
  const key = buildInvitationAssetKey({
    userId: 'u1',
    invitationId: 'i1',
    assetType: 'gallery',
    contentType: 'image/jpeg',
    fileId: 'f1',
  });
  assert.equal(key, 'invitation/production/users/u1/invitations/i1/gallery/f1.jpg');
  process.env.INVITATION_ASSET_ENVIRONMENT = previous;
});

test('7. shared image key (no environment)', () => {
  const key = buildSharedAssetKey({
    kind: 'images',
    concept: 'wedding',
    fileKey: 'floral-01',
    contentType: 'image/webp',
  });
  assert.equal(key, 'invitation/shared/images/wedding/floral-01.webp');
  assert.equal(isSharedInvitationAssetKey(key), true);
  assert.equal(key.includes('/development/'), false);
});

test('8. shared music key', () => {
  const key = buildSharedAssetKey({
    kind: 'music',
    concept: 'wedding',
    fileKey: 'soft-piano-01',
    contentType: 'audio/mpeg',
  });
  assert.equal(key, 'invitation/shared/music/wedding/soft-piano-01.mp3');
});

test('9. temp key under invitation/{env}/temp', () => {
  process.env.INVITATION_ASSET_ENVIRONMENT = 'development';
  const key = buildInvitationTempKey({
    userId: 'u1',
    uploadId: 'up1',
    contentType: 'image/jpeg',
  });
  assert.match(key, /^invitation\/development\/temp\/u1\/up1\/[a-f0-9]+\.jpg$/);
});

test('10. legacy path parse (env before invitation)', () => {
  const legacy = 'development/invitation/users/u1/invitations/i1/gallery/f1.jpg';
  const parsed = parseInvitationUserAssetKey(legacy);
  assert.equal(parsed?.variant, 'legacy');
  assert.equal(parsed?.userId, 'u1');
  assert.equal(parsed?.invitationId, 'i1');
  const media = parseMediaObjectKey(legacy);
  assert.equal(media?.scope, 'invitationGallery');
  assert.equal((media as { userId?: string }).userId, 'u1');
});

test('11. canonical path parse', () => {
  const key = 'invitation/development/users/u1/invitations/i1/gallery/f1.jpg';
  const parsed = parseInvitationUserAssetKey(key);
  assert.equal(parsed?.variant, 'canonical');
  assert.equal(parsed?.environment, 'development');
  assert.equal(parsed?.userId, 'u1');
  assert.equal(parsed?.invitationId, 'i1');
  const media = parseMediaObjectKey(key);
  assert.equal(media?.scope, 'invitationGallery');
});

test('12. wrong user reject shape still parses owner id', () => {
  const key = 'invitation/development/users/other/invitations/i1/gallery/f1.jpg';
  const parsed = parseInvitationUserAssetKey(key);
  assert.equal(parsed?.userId, 'other');
  assert.notEqual(parsed?.userId, 'u1');
});

test('13. wrong invitation reject shape', () => {
  const key = 'invitation/development/users/u1/invitations/other/gallery/f1.jpg';
  const parsed = parseInvitationUserAssetKey(key);
  assert.equal(parsed?.invitationId, 'other');
  assert.notEqual(parsed?.invitationId, 'i1');
});

test('14. shared upload reject for user builder', () => {
  assert.throws(() =>
    buildInvitationAssetKey({
      userId: 'u1',
      invitationId: 'i1',
      assetType: 'shared-music',
      contentType: 'audio/mpeg',
    })
  );
});

test('R2_KEY_PREFIX must not prepend invitation user keys', () => {
  const key = buildInvitationAssetKey({
    userId: 'u1',
    invitationId: 'i1',
    assetType: 'gallery',
    contentType: 'image/jpeg',
    fileId: 'f1',
  });
  assert.equal(key.startsWith('development/'), false);
  assert.equal(key.startsWith('invitation/development/'), true);
});
