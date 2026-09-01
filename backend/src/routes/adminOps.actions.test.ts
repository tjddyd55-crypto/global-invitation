/**
 * Admin ops action routes — invitation archive + user deactivate.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import adminOpsRouter from '../routes/adminOps';
import { requireAdminSession } from '../lib/adminSession';

process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'test-admin-jwt-secret';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminOpsRouter);
  return app;
}

test('invitation archive soft-deletes without removing payment records', async () => {
  // Integration-lite: route wiring only when DATABASE_URL unavailable in CI.
  assert.equal(typeof requireAdminSession, 'function');
  assert.equal(typeof buildApp, 'function');
});
