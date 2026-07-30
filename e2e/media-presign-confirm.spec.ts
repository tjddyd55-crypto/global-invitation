/**
 * Media upload: authenticated presign → R2 PUT → /api/media/confirm (development).
 */
import { test, expect, type Page } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.setTimeout(300_000);

const SMALL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z',
  'base64'
);

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

test('presign PUT confirm stores invitation hero on R2 canonical path', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `media-confirm-${Date.now()}@example.com`;
  await loginInBrowser(page, email);
  const created = await createDraft(page);
  expect(created.ok).toBeTruthy();

  const presign = await page.evaluate(
    async ({ api, invitationId, size }) => {
      const res = await fetch(`${api}/api/media/presign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'invitationHero',
          invitationId,
          filename: 'hero.jpg',
          contentType: 'image/jpeg',
          size,
        }),
      });
      return { status: res.status, body: await res.json() };
    },
    { api: API, invitationId: created.id, size: SMALL_JPEG.length }
  );

  expect(presign.status).toBe(200);
  expect(String(presign.body.objectKey || '')).toMatch(
    /^invitation\/(development|production)\/users\//
  );
  expect(String(presign.body.objectKey || '')).toContain(`/invitations/${created.id}/hero/`);
  expect(String(presign.body.uploadUrl || '')).toBeTruthy();

  const put = await page.request.fetch(presign.body.uploadUrl as string, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    data: SMALL_JPEG,
  });
  expect(put.ok()).toBeTruthy();

  const confirm = await page.evaluate(
    async ({ api, invitationId, objectKey, publicUrl, stagingObjectKey, size }) => {
      const res = await fetch(`${api}/api/media/confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectKey,
          stagingObjectKey,
          publicUrl,
          contentType: 'image/jpeg',
          size,
          usage: 'INVITATION_HERO',
          invitationId,
        }),
      });
      return { status: res.status, body: await res.json() };
    },
    {
      api: API,
      invitationId: created.id,
      objectKey: presign.body.objectKey,
      publicUrl: presign.body.publicUrl,
      stagingObjectKey: presign.body.stagingObjectKey,
      size: SMALL_JPEG.length,
    }
  );

  expect(confirm.status).toBeGreaterThanOrEqual(200);
  expect(confirm.status).toBeLessThan(300);
  expect(String(confirm.body.objectKey || confirm.body.publicUrl || '')).toBeTruthy();
  expect(pageErrors).toEqual([]);
  await context.close();
});
