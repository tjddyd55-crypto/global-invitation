import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import { clearAuthSessionCookie, resolveAuthSessionCookieOptions, setAuthSessionCookie } from './auth';

test('session cookies are host-only and secure on Railway in every NODE_ENV', async () => {
  const keys = ['NODE_ENV', 'RAILWAY_ENVIRONMENT_NAME', 'RAILWAY_PROJECT_ID', 'RAILWAY_SERVICE_ID'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    process.env.NODE_ENV = 'development';
    assert.equal(resolveAuthSessionCookieOptions().secure, false);
    assert.equal(resolveAuthSessionCookieOptions().sameSite, 'lax');
    for (const marker of keys.slice(1)) {
      process.env[marker] = 'fixture';
      await assertSecureCookies();
      delete process.env[marker];
    }
    process.env.NODE_ENV = 'production';
    await assertSecureCookies();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

async function assertSecureCookies() {
  const app = express();
  app.get('/set', (_req, res) => { setAuthSessionCookie(res, 'fixture-token'); res.sendStatus(200); });
  app.get('/clear', (_req, res) => { clearAuthSessionCookie(res); res.sendStatus(200); });
  for (const path of ['/set', '/clear']) {
    const response = await request(app).get(path);
    const cookie = String(response.headers['set-cookie']);
    assert.match(cookie, /; Secure/);
    assert.match(cookie, /; HttpOnly/);
    assert.match(cookie, /; Path=\//);
    assert.match(cookie, /; SameSite=None/);
    assert.doesNotMatch(cookie, /Domain=/i);
  }
}
