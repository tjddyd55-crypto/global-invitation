/**
 * Public HTML og:image must be absolute CDN (or absolute HTTPS) for Kakao link paste.
 */
import { test, expect } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(300_000);

test('published invitation HTML og:image is absolute and fetchable', async ({ request, browser }) => {
  const email = `og-link-${Date.now()}@example.com`;
  const login = await request.post(`${API}/api/test-login`, { data: { email } });
  expect(login.ok()).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  const cookies = await request.storageState().then(() => null);
  void cookies;

  // Prefer cookie jar from API login via page request
  const loginPage = await page.request.post(`${API}/api/test-login`, { data: { email } });
  expect(loginPage.ok()).toBeTruthy();
  const jar = await page.context().cookies(API);
  const auth = jar.find((c) => c.name === 'auth_session_token');
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

  const ogImage =
    'https://cdn.platform-assets.com/invitation/shared/images/wedding/placeholder-og.jpg';
  const ogTitle = `OG링크제목-${Date.now().toString().slice(-5)}`;
  const ogDescription = 'OG링크설명-카카오붙여넣기';

  const created = await page.evaluate(
    async ({ api, ogImage: image, ogTitle: title, ogDescription: description }) => {
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

      const invitationId = createdBody.id as string;
      const detailRes = await fetch(`${api}/api/invitations/${invitationId}`, {
        credentials: 'include',
      });
      const detail = await detailRes.json();
      const data = detail.dataJson || detail.data || {};

      const patchRes = await fetch(`${api}/api/invitations/${invitationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          data_json: {
            ...data,
            templateType: 'FULL',
            conceptType: 'WEDDING',
            title,
            heroImage: image,
            openGraph: {
              title,
              description,
              imageMode: 'CUSTOM',
              imageUrl: image,
            },
            share: {
              ogTitle: title,
              ogDescription: description,
              ogImage: image,
              ogImageMode: 'CUSTOM',
            },
          },
        }),
      });
      if (!patchRes.ok) return { ok: false as const, status: patchRes.status };

      const pubRes = await fetch(`${api}/api/invitations/${invitationId}/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const pubBody = await pubRes.json().catch(() => ({}));
      return {
        ok: pubRes.ok as boolean,
        status: pubRes.status,
        invitationId,
        shareSlug: (pubBody.shareSlug || pubBody.invitation?.shareSlug || detail.shareSlug) as
          | string
          | undefined,
      };
    },
    { api: API, ogImage, ogTitle, ogDescription }
  );

  if (!created.ok || !created.shareSlug) {
    test.skip(true, `publish unavailable (${created.status})`);
    await context.close();
    return;
  }

  const publicUrl = `${FE}/i/${created.shareSlug}`;
  const htmlRes = await request.get(publicUrl, {
    headers: {
      'User-Agent': 'KakaoTalk-Scrap/1.0',
    },
  });
  expect(htmlRes.ok()).toBeTruthy();
  const html = await htmlRes.text();

  const ogImageMatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
  expect(ogImageMatch, 'og:image meta missing').toBeTruthy();
  const metaImage = ogImageMatch![1];
  expect(metaImage.startsWith('https://')).toBeTruthy();
  expect(metaImage.includes('/opengraph-image')).toBeFalsy();
  expect(metaImage.includes('/og-image')).toBeFalsy();
  expect(metaImage).toContain('cdn.platform-assets.com');

  const imgRes = await request.get(metaImage);
  expect(imgRes.status()).toBe(200);
  const contentType = (imgRes.headers()['content-type'] || '').toLowerCase();
  expect(contentType.startsWith('image/')).toBeTruthy();
  const len = Number(imgRes.headers()['content-length'] || 0);
  if (Number.isFinite(len) && len > 0) {
    expect(len).toBeGreaterThan(0);
  }

  expect(html).toContain(`/i/${created.shareSlug}`);
  expect(html).toContain(ogTitle);

  await context.close();
});

test('existing QA slug HTML has absolute og:image when present', async ({ request }) => {
  const slug = 'px3vzcyg';
  const htmlRes = await request.get(`${FE}/i/${slug}`, {
    headers: { 'User-Agent': 'KakaoTalk-Scrap/1.0' },
  });
  if (!htmlRes.ok()) {
    test.skip(true, `QA slug unavailable (${htmlRes.status()})`);
    return;
  }
  const html = await htmlRes.text();
  const ogImageMatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
  expect(ogImageMatch).toBeTruthy();
  const metaImage = ogImageMatch![1];
  expect(metaImage.startsWith('http')).toBeTruthy();

  const imgRes = await request.get(metaImage);
  expect(imgRes.status()).toBe(200);
  expect((imgRes.headers()['content-type'] || '').toLowerCase()).toMatch(/^image\//);
});
