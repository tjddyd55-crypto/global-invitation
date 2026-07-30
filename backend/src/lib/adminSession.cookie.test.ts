/**
 * Unit: admin session cookie options for Railway vs local.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAdminSessionCookieOptions } from './adminSession';

test('local non-railway uses Lax and non-secure cookie', () => {
  const prev = {
    RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
    RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
    RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID,
    NODE_ENV: process.env.NODE_ENV,
  };
  delete process.env.RAILWAY_ENVIRONMENT_NAME;
  delete process.env.RAILWAY_PROJECT_ID;
  delete process.env.RAILWAY_SERVICE_ID;
  process.env.NODE_ENV = 'development';

  try {
    const options = resolveAdminSessionCookieOptions();
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, false);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.path, '/');
  } finally {
    restore(prev);
  }
});

test('railway runtime uses SameSite=None Secure cookie even when NODE_ENV=development', () => {
  const prev = {
    RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
    RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
    RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID,
    NODE_ENV: process.env.NODE_ENV,
  };
  process.env.RAILWAY_ENVIRONMENT_NAME = 'development';
  process.env.NODE_ENV = 'development';

  try {
    const options = resolveAdminSessionCookieOptions();
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, 'none');
    assert.equal(options.path, '/');
  } finally {
    restore(prev);
  }
});

function restore(prev: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(prev)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
