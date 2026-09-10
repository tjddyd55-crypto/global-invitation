import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidCouponCode, normalizeCouponCode, parseCouponCode } from './codes';

test('stores codes as uppercase trimmed values', () => {
  assert.equal(normalizeCouponCode('  jci50  '), 'JCI50');
  assert.equal(parseCouponCode('jci50'), 'JCI50');
});

test('rejects codes outside A-Z0-9-_ or length 4–32', () => {
  assert.equal(isValidCouponCode('AB'), false);
  assert.equal(isValidCouponCode('ABC'), false);
  assert.equal(parseCouponCode('jci 50'), null);
  assert.equal(parseCouponCode('jci50!'), null);
  assert.equal(parseCouponCode('A'.repeat(33)), null);
  assert.ok(isValidCouponCode('JCI50'));
  assert.ok(isValidCouponCode('DEV-FREE_100'));
});
