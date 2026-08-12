import assert from 'node:assert/strict';
import test from 'node:test';
import { isPlatformAppPath } from './platformAppPath';

test('home and marketing public pages hide SaaS GlobalHeader', () => {
  assert.equal(isPlatformAppPath('/'), true);
  assert.equal(isPlatformAppPath('/pricing'), true);
  assert.equal(isPlatformAppPath('/contact'), true);
});

test('legacy marketing legal pages still use GlobalHeader until migrated', () => {
  assert.equal(isPlatformAppPath('/about'), false);
  assert.equal(isPlatformAppPath('/terms'), false);
  assert.equal(isPlatformAppPath('/privacy'), false);
});
