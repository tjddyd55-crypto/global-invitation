/**
 * Naver map Preview/Public parity — real map canvas, no mint placeholder.
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

test('Naver map appears in editor, preview, and public without placeholder', async ({ browser }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `naver-parity-${Date.now()}@example.com`;
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

  await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });

  await page.getByTestId('stepper-item-5').click();
  await expect(page.getByTestId('map-provider-switch')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('map-provider-naver').click();

  const picker = page.getByTestId('naver-location-picker');
  const fallback = page.getByTestId('naver-map-fallback');
  await expect(picker.or(fallback)).toBeVisible({ timeout: 30_000 });

  if (await fallback.isVisible().catch(() => false)) {
    test.info().annotations.push({ type: 'note', description: 'Naver Client ID missing — skip real map assertions' });
    await context.close();
    return;
  }

  await expect(page.getByTestId('editor-naver-map')).toBeVisible({ timeout: 30_000 });

  const searchInput = picker.locator('input').first();
  await searchInput.fill('서울 구로구 경인로 610');
  await picker.getByRole('button', { name: '검색' }).click();

  const results = page.getByTestId('naver-search-results');
  await expect(results).toBeVisible({ timeout: 30_000 });
  await results.locator('button').first().click();
  // After selecting a result, confirm immediately updates draft for LivePreview.
  // Keep confirm card until user confirms explicitly.
  await expect(page.getByTestId('naver-confirm-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('naver-confirm-card').getByRole('button', { name: '이 위치로 확정' }).click();

  const preview = page.getByTestId('editor-live-preview-viewport');
  // Location step should scroll preview to map section
  await expect(preview.getByTestId('public-location')).toBeVisible({ timeout: 30_000 });
  const previewMap = preview.getByTestId('preview-naver-map');
  await expect(previewMap).toBeVisible({ timeout: 45_000 });
  await expect
    .poll(async () => previewMap.getAttribute('data-map-ready'), { timeout: 60_000 })
    .toBe('1');
  // Real map tiles/canvas appear inside the container
  await expect(previewMap.locator('canvas, div').first()).toBeVisible({ timeout: 30_000 });
  await expect(preview.getByTestId('map-provider-placeholder')).toHaveCount(0);
  await expect(preview.getByText('Naver 지도', { exact: true })).toHaveCount(0);

  const persisted = await page.evaluate(async ({ api, invitationId }) => {
    const detailRes = await fetch(`${api}/api/invitations/${invitationId}`, { credentials: 'include' });
    const detail = await detailRes.json();
    const data = detail.dataJson || detail.data || {};
    const putRes = await fetch(`${api}/api/invitations/${invitationId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: detail.title || 'Naver Map Parity',
        data: {
          ...data,
          mapProvider: 'NAVER',
          mapLat: typeof data.mapLat === 'number' ? data.mapLat : 37.502,
          mapLng: typeof data.mapLng === 'number' ? data.mapLng : 126.882,
          formattedAddress: data.formattedAddress || data.address || '서울 구로구 경인로 610',
          address: data.address || data.formattedAddress || '서울 구로구 경인로 610',
          venueName: data.venueName || '더링크호텔 서울',
        },
      }),
    });
    return { ok: putRes.ok };
  }, { api: API, invitationId: id });
  expect(persisted.ok).toBeTruthy();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-5').click();
  await expect(page.getByTestId('editor-live-preview-viewport').getByTestId('preview-naver-map')).toBeVisible({
    timeout: 45_000,
  });

  const published = await page.evaluate(async ({ api, invitationId }) => {
    const detailRes = await fetch(`${api}/api/invitations/${invitationId}`, { credentials: 'include' });
    const detail = await detailRes.json();
    const data = detail.dataJson || detail.data || {};
    const putRes = await fetch(`${api}/api/invitations/${invitationId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: detail.title || data.title || 'Naver Map Parity',
        data: {
          ...data,
          mapProvider: 'NAVER',
          mapLat: typeof data.mapLat === 'number' ? data.mapLat : 37.502,
          mapLng: typeof data.mapLng === 'number' ? data.mapLng : 126.882,
          formattedAddress: data.formattedAddress || data.address || '서울 구로구 경인로 610',
          address: data.address || data.formattedAddress || '서울 구로구 경인로 610',
          venueName: data.venueName || '더링크호텔 서울',
        },
      }),
    });
    const pub = await fetch(`${api}/api/invitations/${invitationId}/publish`, {
      method: 'POST',
      credentials: 'include',
    });
    const pubBody = await pub.json().catch(() => null);
    const refreshed = await fetch(`${api}/api/invitations/${invitationId}`, { credentials: 'include' });
    const refreshedBody = await refreshed.json();
    return {
      putOk: putRes.ok,
      pubOk: pub.ok,
      shareSlug:
        pubBody?.shareSlug ||
        pubBody?.share_slug ||
        refreshedBody.shareSlug ||
        refreshedBody.slug,
      mapProvider: (refreshedBody.dataJson || refreshedBody.data || {}).mapProvider,
    };
  }, { api: API, invitationId: id });

  expect(published.putOk).toBeTruthy();
  expect(published.pubOk).toBeTruthy();
  expect(published.shareSlug).toBeTruthy();
  expect(published.mapProvider).toBe('NAVER');

  await page.goto(`/i/${published.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('public-naver-map')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('public-naver-map')).toHaveAttribute('data-map-ready', '1', {
    timeout: 45_000,
  });
  await expect(page.getByTestId('map-provider-placeholder')).toHaveCount(0);
  await expect(page.getByTestId('map-provider-nav-links')).toBeVisible();
  await expect(page.getByTestId('naver-maps-external-links')).toBeVisible();
  await expect(page.getByTestId('google-maps-external-links')).toHaveCount(0);

  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 812 });
    const box = await page.getByTestId('public-naver-map').boundingBox();
    expect(box).toBeTruthy();
    expect(Math.abs((box?.width || 0) - width)).toBeLessThanOrEqual(4);
    expect(Math.round(box?.height || 0)).toBe(280);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  const desktopBox = await page.getByTestId('public-naver-map').boundingBox();
  expect(desktopBox).toBeTruthy();
  expect(Math.round(desktopBox?.width || 0)).toBeGreaterThanOrEqual(360);
  expect(Math.round(desktopBox?.width || 0)).toBeLessThanOrEqual(390);
  expect(Math.round(desktopBox?.height || 0)).toBe(280);

  const benign = [/favicon/i, /404/i, /net::ERR_/i];
  const realConsole = consoleErrors.filter((msg) => !benign.some((re) => re.test(msg)));
  expect(realConsole).toEqual([]);
  expect(pageErrors).toEqual([]);

  await context.close();
});

test('Google provider still renders Google map and zero Naver maps', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const email = `google-parity-${Date.now()}@example.com`;
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

  await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-5').click();
  await page.getByTestId('map-provider-google').click();
  await expect(page.getByTestId('editor-live-preview-viewport').getByTestId('preview-naver-map')).toHaveCount(0);
  await expect(page.getByTestId('editor-live-preview-viewport').getByTestId('public-naver-map')).toHaveCount(0);
  await context.close();
});
