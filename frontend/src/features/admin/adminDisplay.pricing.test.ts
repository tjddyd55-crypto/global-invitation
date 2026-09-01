import assert from 'node:assert/strict';
import test from 'node:test';
import { parseUsdInput } from './adminDisplay';

test('parseUsdInput accepts USD with up to 2 decimals', () => {
  assert.equal(parseUsdInput('30.00'), 3000);
  assert.equal(parseUsdInput('10'), 1000);
  assert.equal(parseUsdInput('12.50'), 1250);
});

test('parseUsdInput rejects invalid values', () => {
  assert.equal(parseUsdInput(''), null);
  assert.equal(parseUsdInput('-1'), null);
  assert.equal(parseUsdInput('abc'), null);
  assert.equal(parseUsdInput('10.999'), null);
});
