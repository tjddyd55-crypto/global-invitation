import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeUsername, validateUsername } from './username';

test('normalizeUsername lowercases and trims', () => {
  assert.equal(normalizeUsername('  User123  '), 'user123');
});

test('validateUsername accepts valid usernames', () => {
  assert.equal(validateUsername('user_123'), null);
  assert.equal(validateUsername('abcd'), null);
});

test('validateUsername rejects invalid formats', () => {
  assert.equal(validateUsername('ab'), 'USERNAME_TOO_SHORT');
  assert.equal(validateUsername('한글아이디'), 'USERNAME_INVALID_FORMAT');
  assert.equal(validateUsername('user@name'), 'USERNAME_INVALID_FORMAT');
});
