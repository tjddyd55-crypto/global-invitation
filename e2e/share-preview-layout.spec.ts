/**
 * Step 9 keeps Phone Preview and places ShareCardPreview below it.
 */
import { test, expect, type Page } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(240_000);

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
  await page.goto('/m', { waitUntil: 'domcontentloaded', timeout: 90_000 });
}

test('desktop share step: phone preview above share card', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `share-layout-${Date.now()}@example.com`;
  await loginInBrowser(page, email);
  const created = await page.evaluate(async ({ api }) => {
    const res = await fetch(`${api}/api/invitations`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conceptType: 'WEDDING',
        language: 'ko',
        templateKey: 'invitation_full',
      }),
    });
    const body = await res.json();
    return { ok: res.ok, id: body.id as string };
  }, { api: API });
  expect(created.ok).toBeTruthy();

  await page.goto(`/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-9').click();

  const phone = page.getByTestId('editor-live-preview-viewport');
  const shareSlot = page.getByTestId('desktop-share-card-preview-slot');
  await expect(phone).toBeVisible({ timeout: 20_000 });
  await expect(shareSlot).toBeVisible();
  await expect(page.getByTestId('invitation-share-card-preview')).toBeVisible();
  await expect(page.getByTestId('editor-preview-editing-indicator')).toContainText('공유');

  const order = await page.evaluate(() => {
    const phoneEl = document.querySelector('[data-testid="editor-live-preview-viewport"]');
    const shareEl = document.querySelector('[data-testid="desktop-share-card-preview-slot"]');
    if (!phoneEl || !shareEl) return null;
    const phoneTop = phoneEl.getBoundingClientRect().top;
    const shareTop = shareEl.getBoundingClientRect().top;
    return { phoneTop, shareTop, shareBelow: shareTop > phoneTop };
  });
  expect(order?.shareBelow).toBeTruthy();

  expect(pageErrors).toEqual([]);
  await context.close();
});
