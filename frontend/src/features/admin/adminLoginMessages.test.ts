/**
 * Admin login Korean error mapping.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AdminLoginError,
  formatAdminLoginRetryAfter,
  mapAdminLoginErrorMessage,
} from './adminLoginMessages';

test('invalid credentials message is unified Korean', () => {
  assert.equal(
    mapAdminLoginErrorMessage('ADMIN_INVALID_CREDENTIALS'),
    '관리자 아이디 또는 비밀번호가 올바르지 않습니다.'
  );
});

test('rate limit message uses retry hint only when provided', () => {
  assert.match(mapAdminLoginErrorMessage('ADMIN_LOGIN_RATE_LIMITED'), /잠시 후 다시 시도/);
  assert.match(
    mapAdminLoginErrorMessage('ADMIN_LOGIN_RATE_LIMITED', 300),
    /약 5분 후 다시 시도/
  );
});

test('raw English backend message is not shown directly', () => {
  const mapped = mapAdminLoginErrorMessage('Too many login attempts. Please try again later.', 60);
  assert.doesNotMatch(mapped, /Too many login attempts/);
  assert.match(mapped, /로그인 시도가 너무 많습니다/);
});

test('AdminLoginError preserves code and status', () => {
  const error = new AdminLoginError('ADMIN_LOGIN_RATE_LIMITED', 429, 120);
  assert.equal(error.code, 'ADMIN_LOGIN_RATE_LIMITED');
  assert.equal(error.status, 429);
  assert.equal(error.retryAfterSeconds, 120);
});

test('formatAdminLoginRetryAfter returns null without server hint', () => {
  assert.equal(formatAdminLoginRetryAfter(undefined), null);
});
