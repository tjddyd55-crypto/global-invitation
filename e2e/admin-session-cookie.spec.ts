/**
 * Admin cross-origin session cookie E2E (Railway development or local).
 *
 * Secrets: ADMIN_ID / ADMIN_PASSWORD from env only — never logged.
 */
import { expect, test } from '@playwright/test';

const FRONTEND_URL =
  process.env.E2E_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'https://frontend-development-1b8a.up.railway.app';
const API_BASE_URL =
  process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.describe('Admin session cookie (credentials)', () => {
  test('login UI has no env var names and no SaaS header', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: '관리자 로그인' })).toBeVisible();
    await expect(page.getByText('관리자 계정으로 로그인해 주세요.')).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('ADMIN_ID');
    expect(bodyText).not.toContain('ADMIN_PASSWORD');
    expect(bodyText).not.toContain('초대장 만들기');
    expect(bodyText).not.toContain('이메일로 시작하기');
  });

  test('API cookie jar: login → me → logout', async ({ request }) => {
    const adminId = process.env.ADMIN_ID;
    const password = process.env.ADMIN_PASSWORD;
    test.skip(!adminId || !password, 'ADMIN_ID/ADMIN_PASSWORD required');

    const login = await request.post(`${API_BASE_URL}/api/admin/login`, {
      headers: {
        Origin: FRONTEND_URL,
        'Content-Type': 'application/json',
      },
      data: { adminId, password },
    });
    expect(login.status()).toBe(200);

    const setCookie = login.headers()['set-cookie'] || '';
    expect(setCookie.toLowerCase()).toContain('admin_session=');
    expect(setCookie.toLowerCase()).toContain('httponly');

    const me = await request.get(`${API_BASE_URL}/api/admin/me`, {
      headers: { Origin: FRONTEND_URL },
    });
    expect(me.status()).toBe(200);
    const meBody = (await me.json()) as { role?: string; password?: string };
    expect(meBody.role).toBeTruthy();
    expect(meBody.password).toBeUndefined();

    const logout = await request.post(`${API_BASE_URL}/api/admin/logout`, {
      headers: { Origin: FRONTEND_URL },
    });
    expect(logout.status()).toBe(200);

    const meAfter = await request.get(`${API_BASE_URL}/api/admin/me`, {
      headers: { Origin: FRONTEND_URL },
    });
    expect(meAfter.status()).toBe(401);
  });

  test('UI login → /admin → /admin/music → refresh keeps session', async ({ page }) => {
    const adminId = process.env.ADMIN_ID;
    const password = process.env.ADMIN_PASSWORD;
    test.skip(!adminId || !password, 'ADMIN_ID/ADMIN_PASSWORD required');

    await page.goto(`${FRONTEND_URL}/admin/login?next=/admin/music`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByTestId('admin-login-id').fill(adminId!);
    await page.getByTestId('admin-login-password').fill(password!);
    await page.getByTestId('admin-login-submit').click();

    await expect(page).toHaveURL(/\/admin\/music/, { timeout: 30_000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin\/music/);
    await expect(page.getByText('음악 라이브러리').first()).toBeVisible({ timeout: 15_000 });
  });
});
