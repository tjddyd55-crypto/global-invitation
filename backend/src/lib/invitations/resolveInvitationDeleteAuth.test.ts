import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveInvitationDeleteAuth } from './resolveInvitationDeleteAuth';

test('unauthenticated actor is rejected', () => {
  assert.equal(
    resolveInvitationDeleteAuth({
      invitation: { userId: 'owner-1', guestToken: null },
    }),
    'UNAUTHENTICATED'
  );
});

test('non-owner is forbidden', () => {
  assert.equal(
    resolveInvitationDeleteAuth({
      userId: 'other-user',
      invitation: { userId: 'owner-1', guestToken: null },
    }),
    'FORBIDDEN'
  );
});

test('owner can delete', () => {
  assert.equal(
    resolveInvitationDeleteAuth({
      userId: 'owner-1',
      invitation: { userId: 'owner-1', guestToken: null },
    }),
    'OK'
  );
});

test('matching guest token can delete unclaimed invitation', () => {
  assert.equal(
    resolveInvitationDeleteAuth({
      guestToken: 'guest-a',
      invitation: { userId: null, guestToken: 'guest-a' },
    }),
    'OK'
  );
});
