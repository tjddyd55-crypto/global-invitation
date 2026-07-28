/**
 * Open Graph HTML metadata + KakaoTalk UI (KakaoStory removed).
 */
import { test, expect, type Page } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(240_000);
test.use({ baseURL: FE, storageState: { cookies: [], origins: [] } });

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

test('public HTML includes invitation OG meta and KakaoStory is absent', async ({ browser, request }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `og-kakao-${Date.now()}@example.com`;
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
    return { ok: res.ok, data: await res.json() };
  }, { api: API });
  expect(created.ok).toBeTruthy();
  const id = created.data.id as string;

  const ogTitle = '유동규 ♥ 이소영 결혼합니다';
  const ogDescription = '소중한 날에 함께해 주세요';
  const ogImage = 'https://cdn.platform-assets.com/invitation/shared/images/wedding/placeholder-og.jpg';

  const saved = await page.evaluate(
    async ({ api, invitationId, ogTitle, ogDescription, ogImage }) => {
      const detailRes = await fetch(`${api}/api/invitations/${invitationId}`, { credentials: 'include' });
      const detail = await detailRes.json();
      const data = detail.dataJson || detail.data || {};
      const putRes = await fetch(`${api}/api/invitations/${invitationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ogTitle,
          data_json: {
            ...data,
            templateType: 'FULL',
            conceptType: 'WEDDING',
            title: ogTitle,
            heroImage: ogImage,
            openGraph: {
              title: ogTitle,
              description: ogDescription,
              imageUrl: ogImage,
            },
            share: {
              ogTitle,
              ogDescription,
              ogImage,
            },
          },
        }),
      });
      if (!putRes.ok) return { ok: false, status: putRes.status };
      const pubRes = await fetch(`${api}/api/invitations/${invitationId}/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const pubBody = await pubRes.json().catch(() => ({}));
      return {
        ok: pubRes.ok,
        status: pubRes.status,
        shareSlug: pubBody.shareSlug || pubBody.invitation?.shareSlug || detail.shareSlug,
      };
    },
    { api: API, invitationId: id, ogTitle, ogDescription, ogImage }
  );

  if (!saved.ok || !saved.shareSlug) {
    test.skip(true, `publish/shareSlug unavailable (${saved.status})`);
    return;
  }

  const publicPath = `/i/${saved.shareSlug}`;
  const htmlRes = await request.get(`${FE}${publicPath}`);
  expect(htmlRes.ok()).toBeTruthy();
  const html = await htmlRes.text();

  expect(html).toContain(`property="og:title"`);
  expect(html).toContain(ogTitle);
  expect(html).toContain(`property="og:description"`);
  expect(html).toContain(ogDescription);
  expect(html).toContain(`property="og:image"`);
  expect(html).toContain(ogImage);
  expect(html).toContain(`property="og:url"`);
  expect(html).toContain(`/i/${saved.shareSlug}`);
  expect(html.toLowerCase()).not.toContain('story.kakao.com');

  await page.goto(publicPath, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('public-route-root')).toBeVisible({ timeout: 60_000 });
  expect(await page.locator('text=카카오스토리').count()).toBe(0);

  // Open share sheet on mobile block if present
  const shareBtn = page.getByRole('button', { name: '공유하기' }).first();
  if (await shareBtn.count()) {
    await shareBtn.click();
    await expect(page.getByTestId('share-kakao-talk').first()).toBeVisible({ timeout: 10_000 });
    expect(await page.locator('text=카카오스토리').count()).toBe(0);
  }

  expect(pageErrors).toEqual([]);
  await context.close();
});
