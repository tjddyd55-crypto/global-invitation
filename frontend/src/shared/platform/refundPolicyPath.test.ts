import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublicPath, isAppRoute } from './routing';
import { isPlatformAppPath } from './platformAppPath';

test('refund policy is public and keeps a single URL without the platform app shell', () => {
  assert.equal(isPublicPath('/refund-policy'), true);
  assert.equal(isPublicPath('/refund-policy/'), true);
  assert.equal(isPublicPath('/refund-policy-fake'), false);
  assert.equal(isAppRoute('/refund-policy'), false);
  assert.equal(isPlatformAppPath('/refund-policy'), false);
});
