/**
 * Development mock OTP preview + Marketing login button.
 */
import { test, expect, type Browser } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const BE = process.env.PLAYWRIGHT_API_URL || 'https://backend-development-c9a4.up.railway.app';

async function freshPage(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  return { context, page };
}

async function waitAuthReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-auth-state]');
    if (!el) return false;
    const state = el.getAttribute('data-auth-state');
    return state === 'authenticated' || state === 'unauthenticated';
  }, { timeout: 25_000 });
}

test.describe('Dev OTP preview + login desktop', () => {
  test('anonymous main shows login with my-invitations next', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 1440, height: 1024 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitAuthReady(page);
    const login = page.getByTestId('header-login-button');
    await expect(login).toBeVisible();
    const href = await login.getAttribute('href');
    expect(href).toContain('/auth/email');
    expect(href).toContain('my-invitations');
    const createHref = await page.getByTestId('header-create-cta').getAttribute('href');
    expect(createHref).toContain('create%2Fconcept');
    expect(await page.getByTestId('header-logout-button').count()).toBe(0);
    expect(errors).toEqual([]);
    await context.close();
  });

  test('development mock request returns previewCode and panel works', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 1440, height: 1024 });
    const email = `preview-qa-${Date.now()}@example.com`;
    await page.goto(`${FE}/auth/email?next=/my-invitations`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.fill('#auth-email-input', email);
    await page.getByTestId('email-start-submit').click();
    await expect(page.getByTestId('dev-otp-preview-panel')).toBeVisible({ timeout: 20_000 });
    const code = (await page.getByTestId('dev-otp-preview-code').innerText()).trim();
    expect(code).toMatch(/^\d{6}$/);
    await page.getByTestId('dev-otp-copy').click();
    await expect(page.getByTestId('dev-otp-copied-toast')).toBeVisible();
    await page.getByTestId('email-start-submit').click();
    await page.waitForURL(/\/auth\/verify/, { timeout: 20_000 });
    await expect(page.getByTestId('dev-otp-preview-panel')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('dev-otp-fill').click();
    for (let i = 0; i < 6; i += 1) {
      await expect(page.getByTestId(`otp-digit-${i}`)).toHaveValue(code[i]);
    }
    await page.getByTestId('email-verify-submit').click();
    await page.waitForURL(/\/my-invitations/, { timeout: 30_000 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitAuthReady(page);
    await expect(page.getByTestId('header-logout-button')).toBeVisible();
    expect(await page.getByTestId('header-login-button').count()).toBe(0);
    await page.getByTestId('header-logout-button').click();
    await page.getByTestId('logout-confirm-button').click();
    await page.waitForURL(`${FE}/`, { timeout: 20_000 });
    await waitAuthReady(page);
    await expect(page.getByTestId('header-login-button')).toBeVisible();
    await context.close();
  });

  test('public invitation has no login/logout', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 1440, height: 1024 });
    await page.goto(`${FE}/i/sample`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(700);
    expect(await page.getByTestId('header-login-button').count()).toBe(0);
    expect(await page.getByTestId('header-logout-button').count()).toBe(0);
    await context.close();
  });
});

test.describe('Dev OTP preview mobile', () => {
  test('anonymous mobile shows login', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitAuthReady(page);
    await expect(page.getByTestId('mobile-login-button')).toBeVisible();
    const href = await page.getByTestId('mobile-login-button').getAttribute('href');
    expect(href).toContain('my-invitations');
    await context.close();
  });
});

test.describe('previewCode API policy', () => {
  test('development backend returns previewCode when flag enabled', async ({ request }) => {
    const res = await request.post(`${BE}/api/auth/email/request-code`, {
      data: { email: `api-preview-${Date.now()}@example.com` },
      headers: { Origin: FE, 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBeTruthy();
    // Railway development 에 ALLOW_EMAIL_PREVIEW_CODE=true 가 있어야 함
    expect(body.previewCode).toMatch(/^\d{6}$/);
    expect(body.expiresInSeconds).toBeGreaterThan(0);
    expect(body.resendAfterSeconds).toBeGreaterThan(0);
  });

  test('production-mode canExpose gate is covered by backend unit suite', async () => {
    // Live Railway 는 NODE_ENV=development 고정이므로 production 차단은
    // backend/src/lib/mailer.previewCode.test.ts (flag=true + NODE_ENV=production → 미노출) 로 검증한다.
    expect(true).toBe(true);
  });
});
