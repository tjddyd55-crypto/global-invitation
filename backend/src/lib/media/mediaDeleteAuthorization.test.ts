/**
 * Unit checks for media delete authorization (canonical/legacy invitation paths).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

process.env.INVITATION_R2_ROOT_PREFIX = 'invitation';
process.env.INVITATION_ASSET_ENVIRONMENT = 'development';

import { canDeleteByStorageKey } from './mediaDeleteAuthorization';

test('canonical invitation user gallery key allows owner userId match path', async () => {
  // Without DB invitation row, ownership invitation lookup fails — but userId mismatch must fail first.
  const denied = await canDeleteByStorageKey({
    userId: 'other-user',
    isCreator: false,
    key: 'invitation/development/users/owner-user/invitations/inv-1/gallery/file.jpg',
  });
  assert.equal(denied, false);
});

test('shared invitation asset is never deletable', async () => {
  const allowed = await canDeleteByStorageKey({
    userId: 'owner-user',
    isCreator: true,
    key: 'invitation/shared/images/wedding/floral.webp',
  });
  assert.equal(allowed, false);
});

test('legacy env-prefixed invitation key is not rewritten and denies delete', async () => {
  const denied = await canDeleteByStorageKey({
    userId: 'owner-user',
    isCreator: false,
    key: 'development/invitation/users/owner-user/invitations/inv-1/gallery/file.jpg',
  });
  assert.equal(denied, false);
});
