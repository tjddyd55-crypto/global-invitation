/**
 * Unit: editor pathname → invitation upload context.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveInvitationIdFromPathname } from './mediaApi';

test('resolves invitation id from editor / m / pc paths', () => {
  assert.equal(resolveInvitationIdFromPathname('/editor/abc-123'), 'abc-123');
  assert.equal(resolveInvitationIdFromPathname('/m/editor/abc-123/step'), 'abc-123');
  assert.equal(resolveInvitationIdFromPathname('/pc/editor/abc-123'), 'abc-123');
  assert.equal(resolveInvitationIdFromPathname('/pricing'), null);
});
