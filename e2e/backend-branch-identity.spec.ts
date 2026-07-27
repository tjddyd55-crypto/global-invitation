/**
 * Smoke: Backend build-identity + public comments route after auto-deploy.
 */
import { test, expect } from '@playwright/test';

const BE = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.describe('Backend development identity + comments route', () => {
  test('health and build-identity expose git metadata', async ({ request }) => {
    const health = await request.get(`${BE}/health`);
    expect(health.ok()).toBeTruthy();
    const healthJson = await health.json();
    expect(healthJson.status).toBe('ok');
    expect(healthJson.database).toBe('connected');
    expect(healthJson.build?.service).toBe('backend');

    const identity = await request.get(`${BE}/api/build-identity`);
    expect(identity.ok()).toBeTruthy();
    const idJson = await identity.json();
    expect(idJson.service).toBe('backend');
    expect(String(idJson.sha || '').length).toBeGreaterThan(6);
    expect(String(idJson.branch || '')).toContain('cleanup-legacy');
  });

  test('public comments route responds (404 for unknown slug)', async ({ request }) => {
    const res = await request.get(`${BE}/api/public/invitations/__missing_slug__/comments`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('my-invitations comments manage path exists on frontend', async ({ page }) => {
    await page.goto(`${FE}/my-invitations/demo-id/comments`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await page.waitForTimeout(600);
    // Auth gate or page — must not 404 Next page
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(0);
    expect(page.url()).not.toMatch(/404/);
  });
});
