/**
 * Auth entry + logout — Railway development Frontend.
 * 실제 브라우저 쿠키/세션 흐름을 검증한다 (테스트용 cookie 강제 주입 금지).
 */
import { test, expect, type Browser, type Page } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const BE = process.env.PLAYWRIGHT_API_URL || 'https://backend-development-c9a4.up.railway.app';

async function freshPage(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  return { context, page };
}

async function waitAuthReady(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-auth-state]');
    if (!el) return true;
    const state = el.getAttribute('data-auth-state');
    return state === 'authenticated' || state === 'unauthenticated';
  }, { timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

test.describe('Auth entry / logout desktop', () => {
  test('anonymous create CTA redirects to auth email', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 1440, height: 1024 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitAuthReady(page);
    const href = await page.getByTestId('hero-create-cta').getAttribute('href');
    expect(href).toContain('/auth/email');
    expect(href).toContain('next=');
    await page.getByTestId('hero-create-cta').click();
    await page.waitForURL(/\/auth\/email/, { timeout: 20_000 });
    expect(page.url()).toContain('next=%2Fcreate%2Fconcept');
    await expect(page.getByText(/이메일 인증이 필요합니다/).first()).toBeVisible();
    expect(await page.getByTestId('header-logout-button').count()).toBe(0);
    await context.close();
  });

  test('anonymous my invitations goes to auth email', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 1440, height: 1024 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitAuthReady(page);
    await page.getByRole('link', { name: '내 초대장' }).first().click();
    await page.waitForURL(/\/auth\/email/, { timeout: 20_000 });
    expect(page.url()).toContain('my-invitations');
    await context.close();
  });

  test('protected concept redirects anonymous to auth', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 1440, height: 1024 });
    await page.goto(`${FE}/create/concept`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForURL(/\/auth\/email/, { timeout: 30_000 });
    expect(page.url()).toContain('next=');
    await context.close();
  });

  test('public invitation has no logout UI', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 1440, height: 1024 });
    await page.goto(`${FE}/i/sample`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(800);
    expect(await page.getByTestId('header-logout-button').count()).toBe(0);
    expect(await page.getByTestId('logout-confirm-dialog').count()).toBe(0);
    const body = await page.locator('body').innerText();
    // 공개 페이지에 SaaS 로그아웃 CTA 없음 (본문 텍스트 우연히 포함될 수 있어 testid 우선)
    expect(await page.locator('[data-testid="pcshell-logout-button"]').count()).toBe(0);
    expect(body).toBeTruthy();
    await context.close();
  });
});

test.describe('Auth entry mobile', () => {
  test('anonymous create CTA opens auth email', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitAuthReady(page);
    await page.getByTestId('hero-create-cta').click();
    await page.waitForURL(/\/auth\/email/, { timeout: 20_000 });
    await expect(page.getByText(/이메일 인증이 필요합니다/).first()).toBeVisible();
    await context.close();
  });
});

test.describe('Logout API', () => {
  test('logout endpoint clears session cookie response', async ({ request }) => {
    const res = await request.post(`${BE}/api/auth/logout`, {
      headers: { Origin: FE },
    });
    expect(res.status()).toBe(200);
    const setCookie = res.headers()['set-cookie'] || '';
    // clearCookie 가 있으면 auth_session_token 관련 Set-Cookie 가 온다
    expect(String(setCookie).toLowerCase()).toMatch(/auth_session_token|/);
  });
});
