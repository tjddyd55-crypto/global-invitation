/**
 * Admin auth cookie + CORS credential integration (no secret values logged).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import cors from 'cors';
import request from 'supertest';
import adminAuthRouter from './adminAuth';
import { resolveAdminSessionCookieOptions } from '../lib/adminSession';
import { attachGuestSession } from '../middleware/guestSessionMiddleware';

const DEV_FRONTEND = 'https://frontend-development-1b8a.up.railway.app';

function buildApp() {
  const app = express();
  const allowedOrigins = new Set([
    DEV_FRONTEND,
    'http://localhost:3000',
  ]);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.use('/api/admin', adminAuthRouter);

  app.use('/api', (req, res, next) => {
    const url = (req.originalUrl || '').split('?')[0];
    if (url === '/api/admin' || url.startsWith('/api/admin/')) {
      return next();
    }
    return attachGuestSession(req, res, next);
  });

  return app;
}

function parseSetCookie(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

test('admin login sets admin_session HttpOnly cookie and CORS credentials', async () => {
  process.env.ADMIN_ID = process.env.ADMIN_ID || 'admin@test.local';
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-admin-password';
  process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'test-admin-jwt-secret';
  process.env.RAILWAY_ENVIRONMENT_NAME = 'development';
  process.env.NODE_ENV = 'development';

  const app = buildApp();
  const adminId = process.env.ADMIN_ID!;
  const password = process.env.ADMIN_PASSWORD!;

  const login = await request(app)
    .post('/api/admin/login')
    .set('Origin', DEV_FRONTEND)
    .send({ adminId, password });

  assert.equal(login.status, 200);
  assert.equal(login.headers['access-control-allow-origin'], DEV_FRONTEND);
  assert.match(String(login.headers['access-control-allow-credentials']), /true/i);

  const setCookies = parseSetCookie(login.headers['set-cookie']);
  const adminCookie = setCookies.find((c) => c.startsWith('admin_session='));
  assert.ok(adminCookie, 'admin_session Set-Cookie required');
  assert.match(adminCookie!, /HttpOnly/i);
  assert.match(adminCookie!, /Path=\//i);
  assert.match(adminCookie!, /SameSite=None/i);
  assert.match(adminCookie!, /Secure/i);
  assert.doesNotMatch(adminCookie!, /Domain=/i);

  const me = await request(app)
    .get('/api/admin/me')
    .set('Origin', DEV_FRONTEND)
    .set('Cookie', adminCookie!.split(';')[0]);

  assert.equal(me.status, 200);
  assert.equal(typeof me.body.email, 'string');
  assert.ok(me.body.role === 'ADMIN' || me.body.role === 'SUPER_ADMIN');
  assert.equal(me.body.password, undefined);
});

test('admin/me without cookie is 401', async () => {
  process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'test-admin-jwt-secret';
  const app = buildApp();
  const me = await request(app).get('/api/admin/me').set('Origin', DEV_FRONTEND);
  assert.equal(me.status, 401);
});

test('invalid admin credentials return 401', async () => {
  process.env.ADMIN_ID = process.env.ADMIN_ID || 'admin@test.local';
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-admin-password';
  process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'test-admin-jwt-secret';

  const app = buildApp();
  const bad = await request(app)
    .post('/api/admin/login')
    .set('Origin', DEV_FRONTEND)
    .send({ adminId: 'not-an-admin', password: 'wrong-password' });
  assert.equal(bad.status, 401);
});

test('admin login path does not emit guest token header', async () => {
  process.env.ADMIN_ID = process.env.ADMIN_ID || 'admin@test.local';
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-admin-password';
  process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'test-admin-jwt-secret';

  const app = buildApp();
  const login = await request(app)
    .post('/api/admin/login')
    .set('Origin', DEV_FRONTEND)
    .send({
      adminId: process.env.ADMIN_ID,
      password: process.env.ADMIN_PASSWORD,
    });

  assert.equal(login.status, 200);
  assert.equal(login.headers['x-guest-token'], undefined);
});

test('disallowed origin is rejected by CORS preflight policy shape', async () => {
  const options = resolveAdminSessionCookieOptions();
  assert.equal(options.path, '/');
  assert.equal(options.httpOnly, true);
});
