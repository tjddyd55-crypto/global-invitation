/**
 * Visual template catalog / preview / create smoke (development).
 */
import { test, expect, type Page } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.setTimeout(300_000);

async function loginInBrowser(page: Page, email: string) {
  const res = await page.request.post(`${API}/api/test-login`, { data: { email } });
  expect(res.ok()).toBeTruthy();
  const cookies = await page.context().cookies(API);
  const auth = cookies.find((c) => c.name === 'auth_session_token');
  expect(auth).toBeTruthy();
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: auth!.name,
      value: auth!.value,
      domain: auth!.domain,
      path: auth!.path || '/',
      expires: auth!.expires,
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
  ]);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
}

test('template preview is public and Classic catalog creates with visualTemplateId', async ({
  browser,
}) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  // Public preview — no login
  const preview = await page.goto(`${FE}/templates/WEDDING_04_EDITORIAL/preview`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  expect(preview?.ok()).toBeTruthy();
  await expect(page.getByTestId('visual-template-preview')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('모던 에디토리얼').first()).toBeVisible();
  await expect(page.getByText('샘플 미리보기').first()).toBeVisible();
  // No internal id / numbered label in chrome
  await expect(page.getByText('WEDDING_04')).toHaveCount(0);

  const email = `visual-tpl-${Date.now()}@example.com`;
  await loginInBrowser(page, email);

  await page.goto(`${FE}/create/templates?concept=WEDDING`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await expect(page.getByTestId('visual-template-catalog')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('template-card-WEDDING_01_CLASSIC')).toBeVisible();
  await expect(page.getByTestId('template-card-WEDDING_04_EDITORIAL')).toBeVisible();
  await expect(page.getByText('클래식').first()).toBeVisible();

  await page.getByTestId('template-create-WEDDING_05_GARDEN').click();
  await page.waitForURL(/\/editor\//, { timeout: 90_000 });
  await expect(page.getByTestId('editor-template-switcher')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('editor-template-switcher').getByText('로맨틱 가든')).toBeVisible();

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  await context.close();
});
