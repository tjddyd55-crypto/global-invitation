/**
 * Unit checks for invitation asset keys.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

process.env.R2_KEY_PREFIX = 'development';
process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';

import {
  buildInvitationAssetKey,
  buildSharedAssetKey,
  buildInvitationTempKey,
  parseInvitationUserAssetKey,
  isSharedInvitationAssetKey,
} from './invitationAssetKeys';

test('user hero key uses invitation/users/... path', () => {
  const key = buildInvitationAssetKey({
    userId: 'user-1',
    invitationId: 'inv-1',
    assetType: 'hero',
    contentType: 'image/jpeg',
    fileId: 'abc123',
  });
  assert.equal(key, 'development/invitation/users/user-1/invitations/inv-1/hero/abc123.jpg');
  const parsed = parseInvitationUserAssetKey(key);
  assert.equal(parsed?.userId, 'user-1');
  assert.equal(parsed?.invitationId, 'inv-1');
});

test('shared music key', () => {
  const key = buildSharedAssetKey({
    kind: 'music',
    concept: 'wedding',
    fileKey: 'soft-piano-01',
    contentType: 'audio/mpeg',
  });
  assert.equal(key, 'development/invitation/shared/music/wedding/soft-piano-01.mp3');
  assert.equal(isSharedInvitationAssetKey(key), true);
});

test('temp key under invitation/temp', () => {
  const key = buildInvitationTempKey({
    userId: 'user-1',
    uploadId: 'up1',
    contentType: 'image/jpeg',
  });
  assert.match(key, /^development\/invitation\/temp\/user-1\/up1\/[a-f0-9]+\.jpg$/);
});

test('shared upload type denied for user builder', () => {
  assert.throws(() =>
    buildInvitationAssetKey({
      userId: 'u',
      invitationId: 'i',
      assetType: 'shared-music',
      contentType: 'audio/mpeg',
    })
  );
});
