/**
 * Primary admin credential role mapping + SUPER_ADMIN session validation.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import adminAuthRouter from './adminAuth';
import adminOpsRouter from './adminOps';
import {
  resolvePrimaryAdminSessionRole,
  setAdminSessionCookie,
} from '../lib/adminSession';

const DEV_FRONTEND = 'https://frontend-development-1b8a.up.railway.app';

function buildAuthApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminAuthRouter);
  return app;
}

function buildOpsApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminOpsRouter);
  return app;
}

test('primary admin credential resolves to SUPER_ADMIN role', () => {
  assert.equal(resolvePrimaryAdminSessionRole(), 'SUPER_ADMIN');
});

test('ADMIN_ID login issues SUPER_ADMIN role on /me', async () => {
  process.env.ADMIN_ID = 'ops-admin@test.local';
  process.env.ADMIN_PASSWORD = 'test-admin-password';
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt-secret';
  delete process.env.SUPER_ADMIN_EMAIL;
  delete process.env.SUPER_ADMIN_PASSWORD;

  const app = buildAuthApp();
  const login = await request(app)
    .post('/api/admin/login')
    .set('Origin', DEV_FRONTEND)
    .send({ adminId: process.env.ADMIN_ID, password: process.env.ADMIN_PASSWORD });

  assert.equal(login.status, 200);
  assert.equal(login.body.role, 'SUPER_ADMIN');

  const cookie = login.headers['set-cookie']?.[0]?.split(';')[0];
  assert.ok(cookie);

  const me = await request(app).get('/api/admin/me').set('Cookie', cookie);
  assert.equal(me.status, 200);
  assert.equal(me.body.role, 'SUPER_ADMIN');
});

test('legacy ADMIN role session still authenticates but requireSuper returns 403', async () => {
  process.env.ADMIN_ID = 'legacy-admin@test.local';
  process.env.ADMIN_PASSWORD = 'test-admin-password';
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt-secret';

  const authApp = express();
  authApp.use(express.json());
  authApp.get('/set-admin-cookie', (_req, res) => {
    setAdminSessionCookie(res, process.env.ADMIN_ID!, 'ADMIN');
    res.status(200).json({ ok: true });
  });
  authApp.use('/api/admin', adminAuthRouter);

  const cookieRes = await request(authApp).get('/set-admin-cookie');
  const cookie = cookieRes.headers['set-cookie']?.[0]?.split(';')[0];
  assert.ok(cookie);

  const me = await request(authApp).get('/api/admin/me').set('Cookie', cookie);
  assert.equal(me.status, 200);
  assert.equal(me.body.role, 'ADMIN');

  const opsApp = buildOpsApp();
  const pricing = await request(opsApp)
    .put('/api/admin/ops/payments/pricing')
    .set('Cookie', cookie)
    .send({ listPriceMinor: 3000, salePriceMinor: 1000, promoEnabled: true });

  assert.equal(pricing.status, 403);
  assert.equal(pricing.body.error, 'SUPER_ADMIN_REQUIRED');
});

test('SUPER_ADMIN session can reach requireSuper pricing endpoint validation path', async () => {
  process.env.ADMIN_ID = 'super-ops@test.local';
  process.env.ADMIN_PASSWORD = 'test-admin-password';
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt-secret';

  const app = buildAuthApp();
  const login = await request(app)
    .post('/api/admin/login')
    .send({ adminId: process.env.ADMIN_ID, password: process.env.ADMIN_PASSWORD });
  assert.equal(login.status, 200);
  assert.equal(login.body.role, 'SUPER_ADMIN');

  const cookie = login.headers['set-cookie']?.[0]?.split(';')[0];
  const opsApp = buildOpsApp();
  const pricing = await request(opsApp)
    .put('/api/admin/ops/payments/pricing')
    .set('Cookie', cookie)
    .send({ listPriceMinor: 3000, salePriceMinor: 1000, promoEnabled: true });

  assert.notEqual(pricing.status, 403);
});
