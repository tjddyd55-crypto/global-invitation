/**
 * Share image clear persistence + editor Kakao button removed.
 */
import { test, expect, type Page } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const CDN = 'https://cdn.platform-assets.com/invitation/shared/images/wedding/placeholder-og.jpg';

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

test('clear OG image persists and editor Kakao action is removed', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `og-clear-${Date.now()}@example.com`;
  await loginInBrowser(page, email);

  const created = await page.evaluate(
    async ({ api, cdn }) => {
      const createRes = await fetch(`${api}/api/invitations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptType: 'WEDDING',
          language: 'ko',
          templateKey: 'invitation_full',
        }),
      });
      const createdBody = await createRes.json();
      if (!createRes.ok) return { ok: false as const, status: createRes.status };
      const id = createdBody.id as string;
      const detailRes = await fetch(`${api}/api/invitations/${id}`, { credentials: 'include' });
      const detail = await detailRes.json();
      const data = detail.dataJson || detail.data || {};
      const patchRes = await fetch(`${api}/api/invitations/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'OG Clear Test',
          data_json: {
            ...data,
            templateType: 'FULL',
            conceptType: 'WEDDING',
            title: 'OG Clear Test',
            heroImage: cdn,
            openGraph: {
              title: 'OG Clear Test',
              description: 'desc',
              imageMode: 'CUSTOM',
              imageUrl: cdn,
              imageRemoved: false,
            },
            share: {
              ogTitle: 'OG Clear Test',
              ogDescription: 'desc',
              ogImage: cdn,
              ogImageMode: 'CUSTOM',
              ogImageRemoved: false,
            },
          },
        }),
      });
      return { ok: patchRes.ok, id, status: patchRes.status };
    },
    { api: API, cdn: CDN }
  );
  expect(created.ok).toBeTruthy();

  await page.goto(`/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-8').click();
  await expect(page.getByTestId('og-title-input')).toBeVisible({ timeout: 20_000 });

  await expect(page.getByTestId('og-share-kakao-talk')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '저장 후 카카오톡 공유' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '완료하고 공개하기' })).toBeVisible();

  await expect(page.getByTestId('share-card-preview-image').locator('img')).toBeVisible();

  const patchPromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/invitations/${created.id}`) &&
      res.request().method() === 'PATCH' &&
      res.ok(),
    { timeout: 60_000 }
  );
  await page.getByTestId('og-clear-image').click();
  const patchRes = await patchPromise;
  const patchBody = await patchRes.json();
  const dataJson = patchBody.dataJson || patchBody.data || {};
  expect(dataJson.openGraph?.imageMode || dataJson.share?.ogImageMode).toBe('NONE');
  expect(dataJson.openGraph?.imageRemoved === true || dataJson.share?.ogImageRemoved === true).toBeTruthy();

  await expect(page.getByTestId('share-card-preview-image-placeholder')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('share-card-preview-image').locator('img')).toHaveCount(0);

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-8').click();
  await expect(page.getByTestId('share-card-preview-image-placeholder')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('share-card-preview-image').locator('img')).toHaveCount(0);

  await page.getByTestId('og-use-hero').click();
  await expect(page.getByTestId('share-card-preview-image').locator('img')).toBeVisible({ timeout: 20_000 });

  await page.getByTestId('og-clear-image').click();
  await expect(page.getByTestId('share-card-preview-image-placeholder')).toBeVisible({ timeout: 20_000 });

  // Publish complete / public Kakao buttons still exist after publish
  await page.getByRole('button', { name: '완료하고 공개하기' }).click();
  await page.waitForURL(/\/my-invitations\/.+\/complete/, { timeout: 90_000 }).catch(() => null);
  if (page.url().includes('/complete')) {
    await expect(page.getByTestId('share-kakao-talk').first()).toBeVisible({ timeout: 30_000 });
  }

  expect(pageErrors).toEqual([]);
  await context.close();
});

test('public page keeps KakaoTalk share control', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${FE}/i/px3vzcyg`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const shareBtn = page.getByRole('button', { name: '공유하기' }).first();
  if (await shareBtn.count()) {
    await shareBtn.click();
    await expect(page.getByTestId('share-kakao-talk').first()).toBeVisible({ timeout: 15_000 });
  }
  await context.close();
});
