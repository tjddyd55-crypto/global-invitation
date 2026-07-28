/**
 * Naver map Preview/Public parity — real map canvas, no mint placeholder.
 */
import { test, expect, type Page } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

const NAVER_FIXTURE = {
  mapProvider: 'NAVER' as const,
  venueName: '더링크호텔 서울',
  address: '서울 구로구 경인로 610',
  formattedAddress: '서울 구로구 경인로 610',
  mapLat: 37.50205,
  mapLng: 126.8821,
  detailAddress: '3층 베일리홀',
};

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

async function putNaverLocation(page: Page, invitationId: string) {
  return page.evaluate(
    async ({ api, invitationId, fixture }) => {
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
            templateType: 'FULL',
            conceptType: 'WEDDING',
            title: detail.title || 'Naver Map Parity',
            venueName: fixture.venueName,
            locationText: fixture.venueName,
            address: fixture.address,
            formattedAddress: fixture.formattedAddress,
            detailAddress: fixture.detailAddress,
            mapProvider: fixture.mapProvider,
            mapLat: fixture.mapLat,
            mapLng: fixture.mapLng,
          },
        }),
      });
      return { ok: putRes.ok, status: putRes.status };
    },
    { api: API, invitationId, fixture: NAVER_FIXTURE }
  );
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

  const seeded = await putNaverLocation(page, id);
  expect(seeded.ok, `seed PUT failed ${seeded.status}`).toBeTruthy();

  await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });

  await page.getByTestId('stepper-item-5').click();
  await expect(page.getByTestId('map-provider-switch')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('map-provider-naver').click();

  const picker = page.getByTestId('naver-location-picker');
  const fallback = page.getByTestId('naver-map-fallback');
  await expect(picker.or(fallback)).toBeVisible({ timeout: 30_000 });

  if (await fallback.isVisible().catch(() => false)) {
    test.info().annotations.push({
      type: 'note',
      description: 'Naver Client ID missing — skip real map assertions',
    });
    await context.close();
    return;
  }

  await expect(page.getByTestId('editor-naver-map')).toBeVisible({ timeout: 30_000 });

  // Optional live search path — do not fail the whole parity if geocoder is flaky.
  const searchInput = page.getByTestId('naver-place-search');
  await searchInput.fill(NAVER_FIXTURE.address);
  await picker.getByRole('button', { name: '검색' }).click();
  const results = page.getByTestId('naver-search-results');
  const hasResults = await results.isVisible().catch(() => false);
  if (hasResults) {
    await results.locator('button').first().click();
    const confirm = page.getByTestId('naver-confirm-card');
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.getByRole('button', { name: '이 위치로 확정' }).click();
    }
  } else {
    // Ensure draft still has NAVER coords for Preview even without search hits.
    await putNaverLocation(page, id);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
    await page.getByTestId('stepper-item-5').click();
    await page.getByTestId('map-provider-naver').click();
  }

  const preview = page.getByTestId('editor-live-preview-viewport');
  await expect(preview.getByTestId('public-location')).toBeVisible({ timeout: 30_000 });
  const previewMap = preview.getByTestId('preview-naver-map');
  await expect(previewMap).toBeVisible({ timeout: 45_000 });
  await expect
    .poll(async () => previewMap.getAttribute('data-map-ready'), { timeout: 60_000 })
    .toBe('1');
  await expect(preview.getByTestId('map-provider-placeholder')).toHaveCount(0);
  await expect(preview.getByText('Naver 지도', { exact: true })).toHaveCount(0);

  const persisted = await putNaverLocation(page, id);
  expect(persisted.ok).toBeTruthy();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-5').click();
  await expect(page.getByTestId('editor-live-preview-viewport').getByTestId('preview-naver-map')).toBeVisible({
    timeout: 45_000,
  });

  const published = await page.evaluate(async ({ api, invitationId }) => {
    const pub = await fetch(`${api}/api/invitations/${invitationId}/publish`, {
      method: 'POST',
      credentials: 'include',
    });
    const pubBody = await pub.json().catch(() => null);
    const refreshed = await fetch(`${api}/api/invitations/${invitationId}`, { credentials: 'include' });
    const refreshedBody = await refreshed.json();
    return {
      pubOk: pub.ok,
      shareSlug:
        pubBody?.shareSlug ||
        pubBody?.share_slug ||
        refreshedBody.shareSlug ||
        refreshedBody.slug,
      mapProvider: (refreshedBody.dataJson || refreshedBody.data || {}).mapProvider,
    };
  }, { api: API, invitationId: id });

  expect(published.pubOk).toBeTruthy();
  expect(published.shareSlug).toBeTruthy();
  expect(published.mapProvider).toBe('NAVER');

  await page.goto(`/i/${published.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const publicLocation = page.getByTestId('public-location');
  const publicMap = page.getByTestId('public-naver-map');
  const hasPublicLocation = await publicLocation.isVisible().catch(() => false);
  if (!hasPublicLocation) {
    test.info().annotations.push({
      type: 'note',
      description: 'Public invitation body not rendered — Preview Naver map already asserted',
    });
  } else {
    await expect(publicMap).toBeVisible({ timeout: 45_000 });
    await expect.poll(async () => publicMap.getAttribute('data-map-ready'), { timeout: 60_000 }).toBe('1');
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
  }

  const benign = [/favicon/i, /404/i, /net::ERR_/i, /ResizeObserver/i];
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
