import fs from 'fs';
import path from 'path';
import { request, type FullConfig } from '@playwright/test';

const DEFAULT_TEST_EMAIL = 'test@example.com';

export default async function globalSetup(_config: FullConfig) {
  const apiBaseUrl = process.env.E2E_API_BASE_URL || 'http://localhost:3001';
  const testEmail = process.env.E2E_TEST_EMAIL || DEFAULT_TEST_EMAIL;

  const context = await request.newContext({
    baseURL: apiBaseUrl,
  });

  const response = await context.post('/api/test-login', {
    data: {
      email: testEmail,
    },
  });

  if (!response.ok()) {
    const payload = await response.text();
    throw new Error(`test-login failed (${response.status()}): ${payload}`);
  }

  const authDir = path.resolve(__dirname, '.auth');
  const storageStatePath = path.resolve(authDir, 'user.json');
  fs.mkdirSync(authDir, { recursive: true });
  await context.storageState({ path: storageStatePath });
  await context.dispose();
}
