/**
 * Share settings — live messenger card preview (Desktop right / Mobile inline).
 */
import { test, expect, type Page } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
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

async function createPublishedInvitation(page: Page) {
  return page.evaluate(async ({ api }) => {
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
    const created = await createRes.json();
    if (!createRes.ok) return { ok: false as const, status: createRes.status };

    const invitationId = created.id as string;
    const detailRes = await fetch(`${api}/api/invitations/${invitationId}`, { credentials: 'include' });
    const detail = await detailRes.json();
    const data = detail.dataJson || detail.data || {};
    const ogTitle = '공유카드미리보기제목';
    const ogDescription = '공유카드미리보기설명';
    const ogImage = 'https://cdn.platform-assets.com/invitation/shared/images/wedding/placeholder-og.jpg';

    const patchRes = await fetch(`${api}/api/invitations/${invitationId}`, {
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
          openGraph: { title: ogTitle, description: ogDescription, imageUrl: ogImage },
          share: { ogTitle, ogDescription, ogImage },
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
      shareSlug: (pubBody.shareSlug || pubBody.invitation?.shareSlug || detail.shareSlug) as string | undefined,
      ogTitle,
      ogDescription,
      ogImage,
    };
  }, { api: API });
}

test('desktop share step shows live card preview with /i URL', async ({ browser, request }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `share-card-desk-${Date.now()}@example.com`;
  await loginInBrowser(page, email);
  const created = await createPublishedInvitation(page);
  if (!created.ok || !created.shareSlug || !created.invitationId) {
    test.skip(true, `publish unavailable (${created.status})`);
    return;
  }

  await page.goto(`/editor/${created.invitationId}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 30_000 });

  await page.getByTestId('stepper-item-8').click();
  await expect(page.getByTestId('og-title-input')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('desktop-share-card-preview-slot')).toBeVisible();
  await expect(page.getByTestId('invitation-share-card-preview')).toBeVisible();
  await expect(page.getByTestId('editor-live-preview-viewport')).toBeVisible();
  await expect(page.getByTestId('editor-live-preview-panel')).toBeVisible();
  await expect(page.locator('[data-testid="desktop-editor-preview"]')).toHaveAttribute(
    'data-preview-mode',
    'phone-and-share'
  );
  const liveTitle = `라이브제목-${Date.now().toString().slice(-4)}`;
  const liveDesc = `라이브설명-${Date.now().toString().slice(-4)}`;
  await page.getByTestId('og-title-input').fill(liveTitle);
  await page.getByTestId('og-description-input').fill(liveDesc);

  await expect(page.getByTestId('share-card-preview-title')).toHaveText(liveTitle);
  await expect(page.getByTestId('share-card-preview-description')).toHaveText(liveDesc);
  await expect(page.getByTestId('share-card-preview-url')).toContainText(`/i/${created.shareSlug}`);
  await expect(page.getByTestId('share-card-preview-url')).not.toHaveText(
    new RegExp(`^frontend-development-1b8a\\.up\\.railway\\.app/?$`)
  );

  const box = await page.getByTestId('invitation-share-card-preview').boundingBox();
  expect(box).toBeTruthy();
  expect((box?.width || 0) ).toBeLessThanOrEqual(360);

  const htmlRes = await request.get(`${FE}/i/${created.shareSlug}`);
  expect(htmlRes.ok()).toBeTruthy();
  const html = await htmlRes.text();
  // Saved values still in public HTML until save — live draft may differ; assert URL shape parity
  expect(html).toContain(`/i/${created.shareSlug}`);
  expect(html.toLowerCase()).not.toContain('story.kakao.com');

  expect(pageErrors).toEqual([]);
  await context.close();
});

test('mobile share step shows inline card preview without horizontal overflow', async ({ browser }) => {
  for (const width of [375, 390] as const) {
    const pageErrors: string[] = [];
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const email = `share-card-m${width}-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    const created = await createPublishedInvitation(page);
    if (!created.ok || !created.shareSlug || !created.invitationId) {
      test.skip(true, `publish unavailable (${created.status})`);
      await context.close();
      return;
    }

    await page.goto(`/editor/${created.invitationId}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });

    // Force mobile shell if desktop still flashes
    await page.setViewportSize({ width, height: 844 });
    await page.getByTestId('stepper-item-8').click();
    await expect(page.getByTestId('og-title-input')).toBeVisible({ timeout: 20_000 });

    const card = page.getByTestId('invitation-share-card-preview');
    await expect(card).toBeVisible({ timeout: 20_000 });

    const liveTitle = `모바일제목${width}`;
    await page.getByTestId('og-title-input').fill(liveTitle);
    await expect(page.getByTestId('share-card-preview-title')).toHaveText(liveTitle);
    await expect(page.getByTestId('share-card-preview-url')).toContainText(`/i/${created.shareSlug}`);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    expect(pageErrors).toEqual([]);
    await context.close();
  }
});

test('unpublished draft shows pending URL copy without root fallback', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const email = `share-card-draft-${Date.now()}@example.com`;
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
  await page.getByTestId('stepper-item-8').click();
  await expect(page.getByTestId('share-card-preview-url-pending')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('share-card-preview-url')).toHaveCount(0);
  await expect(page.locator('[data-testid="share-card-preview-url-pending"]')).toContainText('공개 후');

  await context.close();
});
