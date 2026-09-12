import assert from 'node:assert/strict';
import test from 'node:test';
import { createOwnerPreviewToken, verifyOwnerPreviewToken } from './ownerPreviewToken';

process.env.OWNER_PREVIEW_TOKEN_SECRET = 'test-owner-preview-secret';

test('owner preview token roundtrip', () => {
  const token = createOwnerPreviewToken('inv-1', 'user-1');
  const payload = verifyOwnerPreviewToken(token);
  assert.ok(payload);
  assert.equal(payload?.invitationId, 'inv-1');
  assert.equal(payload?.userId, 'user-1');
});

test('owner preview token rejects tampered signature', () => {
  const token = createOwnerPreviewToken('inv-1', 'user-1');
  const tampered = `${token}x`;
  assert.equal(verifyOwnerPreviewToken(tampered), null);
});
