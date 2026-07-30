/**
 * Editor music step — independent Step 9, no music in RSVP, nav to share.
 */
import { test, expect, type Page } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

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
  await page.goto('/m', { waitUntil: 'domcontentloaded', timeout: 90_000 });
}

async function createDraft(page: Page) {
  return page.evaluate(async ({ api }) => {
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
}

test('music is dedicated step 9; rsvp has no music; nav order preserved', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `music-step-${Date.now()}@example.com`;
  await loginInBrowser(page, email);
  const created = await createDraft(page);
  expect(created.ok).toBeTruthy();

  await page.goto(`/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 60_000 });

  await expect(page.getByTestId('stepper-item-8')).toContainText('음악 설정');
  await expect(page.getByTestId('stepper-item-9')).toContainText('공유 설정');

  await page.getByTestId('stepper-item-7').click();
  await expect(page.getByTestId('editor-rsvp-step')).toBeVisible();
  await expect(page.getByTestId('editor-music-step')).toHaveCount(0);
  await expect(page.getByTestId('editor-music-enabled-toggle')).toHaveCount(0);

  await page.getByTestId('stepper-item-8').click();
  await expect(page.getByTestId('editor-music-step')).toBeVisible();
  await expect(page.getByTestId('editor-music-enabled-toggle')).toBeVisible();
  await expect(page.getByTestId('invitation-music-player')).toHaveCount(0);

  await page.getByRole('button', { name: '다음 단계로 →' }).click();
  await expect(page.getByTestId('editor-music-step')).toHaveCount(0);
  await expect(
    page.getByTestId('desktop-share-card-preview-slot').or(page.getByTestId('invitation-share-card-preview'))
  ).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: '← 이전' }).click();
  await expect(page.getByTestId('editor-music-step')).toBeVisible();

  expect(pageErrors).toEqual([]);
  await context.close();
});
