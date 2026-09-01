/**
 * Admin login rate limit policy and key strategy.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdminLoginRateLimitKey,
  checkAdminLoginRateLimit,
  clearAdminLoginRateLimit,
  recordAdminLoginFailure,
  resetAdminLoginRateLimitStore,
  resolveAdminLoginRateLimitConfig,
} from './adminLoginRateLimit';

const DEV_CONFIG = { maxAttempts: 10, windowMs: 300_000 };
const PROD_CONFIG = { maxAttempts: 5, windowMs: 60_000 };

test('development defaults to 10 attempts per 5 minutes', () => {
  process.env.RAILWAY_ENVIRONMENT_NAME = 'development';
  delete process.env.ADMIN_LOGIN_RATE_LIMIT_MAX;
  delete process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_SEC;
  const config = resolveAdminLoginRateLimitConfig();
  assert.equal(config.maxAttempts, 10);
  assert.equal(config.windowMs, 300_000);
});

test('production defaults to 5 attempts per 60 seconds', () => {
  process.env.RAILWAY_ENVIRONMENT_NAME = 'production';
  delete process.env.ADMIN_LOGIN_RATE_LIMIT_MAX;
  delete process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_SEC;
  const config = resolveAdminLoginRateLimitConfig();
  assert.equal(config.maxAttempts, 5);
  assert.equal(config.windowMs, 60_000);
});

test('env overrides rate limit config', () => {
  process.env.ADMIN_LOGIN_RATE_LIMIT_MAX = '7';
  process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_SEC = '120';
  const config = resolveAdminLoginRateLimitConfig();
  assert.equal(config.maxAttempts, 7);
  assert.equal(config.windowMs, 120_000);
  delete process.env.ADMIN_LOGIN_RATE_LIMIT_MAX;
  delete process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_SEC;
});

test('failed attempts trigger 429 state and success clears counter', () => {
  resetAdminLoginRateLimitStore();
  const key = buildAdminLoginRateLimitKey('127.0.0.1', 'admin@test.local');

  for (let i = 0; i < PROD_CONFIG.maxAttempts - 1; i += 1) {
    const state = recordAdminLoginFailure(key, PROD_CONFIG);
    assert.equal(state.limited, false);
  }

  const limited = recordAdminLoginFailure(key, PROD_CONFIG);
  assert.equal(limited.limited, true);
  assert.ok(limited.retryAfterSeconds > 0);

  const blocked = checkAdminLoginRateLimit(key, PROD_CONFIG);
  assert.equal(blocked.limited, true);

  clearAdminLoginRateLimit(key);
  const afterReset = checkAdminLoginRateLimit(key, PROD_CONFIG);
  assert.equal(afterReset.limited, false);
  assert.equal(afterReset.remainingAttempts, PROD_CONFIG.maxAttempts);
});

test('rate limit key separates IP and admin identifier', () => {
  const keyA = buildAdminLoginRateLimitKey('1.1.1.1', 'admin-a');
  const keyB = buildAdminLoginRateLimitKey('1.1.1.1', 'admin-b');
  assert.notEqual(keyA, keyB);
});

test('development threshold allows more failures than production', () => {
  resetAdminLoginRateLimitStore();
  const key = buildAdminLoginRateLimitKey('10.0.0.2', 'qa-admin');

  for (let i = 0; i < DEV_CONFIG.maxAttempts; i += 1) {
    const state = recordAdminLoginFailure(key, DEV_CONFIG);
    assert.equal(state.limited, i === DEV_CONFIG.maxAttempts - 1);
  }
});
