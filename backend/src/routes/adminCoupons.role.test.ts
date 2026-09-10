import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import adminAuthRouter from './adminAuth';
import adminCouponsRouter from './adminCoupons';
import { setAdminSessionCookie } from '../lib/adminSession';

function buildCouponOpsApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminCouponsRouter);
  return app;
}

test('ADMIN role cannot create coupons (SUPER_ADMIN only)', async () => {
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

  const opsApp = buildCouponOpsApp();
  const created = await request(opsApp)
    .post('/api/admin/ops/coupons')
    .set('Cookie', cookie)
    .send({
      code: 'JCI50',
      name: 'JCI 50% 할인',
      discountType: 'PERCENT',
      discountValue: 50,
    });

  assert.equal(created.status, 403);
  assert.equal(created.body.error, 'SUPER_ADMIN_REQUIRED');
});
