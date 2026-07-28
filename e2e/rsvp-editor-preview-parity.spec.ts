/**
 * RSVP Editor Preview ↔ Public parity.
 * - enabled 토글 / buttonLabel SSOT
 * - comments 독립
 * - attendance step 자동 포커스
 */
import { test, expect, type Page } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const CUSTOM_LABEL = '참석여부 확인 테스트';

test.setTimeout(180_000);
test.use({
  baseURL: FE,
  storageState: { cookies: [], origins: [] },
});

async function loginInBrowser(page: Page, email: string) {
  const res = await page.request.post(`${API}/api/test-login`, { data: { email } });
  expect(res.ok(), `test-login HTTP ${res.status()}`).toBeTruthy();
  const cookies = await page.context().cookies(API);
  const auth = cookies.find((c) => c.name === 'auth_session_token');
  expect(auth, 'auth_session_token missing').toBeTruthy();
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
  const me = await page.evaluate(async ({ api }) => {
    const response = await fetch(`${api}/api/auth/me`, { credentials: 'include' });
    return { ok: response.ok, status: response.status };
  }, { api: API });
  expect(me.ok, `auth/me failed status=${me.status}`).toBeTruthy();
}

async function createWeddingFixture(page: Page) {
  const email = `rsvp-parity-${Date.now()}@example.com`;
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
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  }, { api: API });
  expect(created.ok, `create invitation ${created.status}`).toBeTruthy();
  const id = created.data.id as string;

  const published = await page.evaluate(
    async ({ api, id, label }) => {
      const putRes = await fetch(`${api}/api/invitations/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'RSVP Parity Wedding',
          data: {
            templateType: 'FULL',
            conceptType: 'WEDDING',
            title: 'RSVP Parity Wedding',
            heroTitle: 'RSVP Parity Wedding',
            heroSubtitle: '2026.10.10',
            content: '참석 여부 테스트',
            eventDate: '2026-10-10T14:00:00+09:00',
            locationText: '서울',
            schedule: ['2026-10-10 14:00'],
            rsvpEnabled: true,
            guestbookEnabled: true,
            commentsEnabled: true,
            rsvp: { enabled: true, buttonLabel: label },
            rsvpButton: label,
            rsvpButtonLabel: label,
            groomName: '신랑',
            brideName: '신부',
            groomPhone: '',
            bridePhone: '',
            parentsInfo: '',
            groom: { name: '신랑', phone: '', parentsText: '', image: '' },
            bride: { name: '신부', phone: '', parentsText: '', image: '' },
            coupleNames: '신랑 ♥ 신부',
            heroImage: '',
            galleryImages: [],
            address: '서울',
            mapImage: '',
            transportInfo: [],
            parkingInfo: [],
            accounts: [
              { role: '신랑', bank: '국민', number: '123', holder: '신랑' },
            ],
            messages: [],
            weddingDateTime: '2026-10-10 14:00',
            venueName: '서울홀',
            introQuote: '참석 여부 테스트',
            introText: [],
          },
        }),
      });
      const putBody = await putRes.json().catch(() => null);
      const pub = await fetch(`${api}/api/invitations/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      const pubBody = await pub.json().catch(() => null);
      const detail = await fetch(`${api}/api/invitations/${id}`, { credentials: 'include' });
      const detailBody = await detail.json();
      return {
        putOk: putRes.ok,
        putStatus: putRes.status,
        putBody,
        pubOk: pub.ok,
        shareSlug: pubBody?.shareSlug || pubBody?.share_slug || detailBody.shareSlug || detailBody.slug,
        slug: detailBody.slug as string,
        rsvpEnabled: detailBody.dataJson?.rsvpEnabled ?? detailBody.data?.rsvpEnabled,
        rsvpButton: detailBody.dataJson?.rsvpButton ?? detailBody.data?.rsvpButton,
      };
    },
    { api: API, id, label: CUSTOM_LABEL }
  );

  expect(published.putOk, `PUT invitation failed ${published.putStatus}`).toBeTruthy();
  expect(published.pubOk, 'publish failed').toBeTruthy();
  expect(published.shareSlug).toBeTruthy();
  expect(published.rsvpEnabled).toBe(true);
  expect(published.rsvpButton).toBe(CUSTOM_LABEL);

  return { email, id, slug: published.slug, shareSlug: published.shareSlug as string };
}

async function goToRsvpStep(page: Page) {
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  const step = page.getByTestId('stepper-item-7');
  await expect(step).toBeVisible({ timeout: 30_000 });
  await step.click();
  await expect(page.getByTestId('editor-rsvp-toggle')).toBeVisible({ timeout: 20_000 });
}

test.describe('RSVP editor preview parity', () => {
  test('desktop: ON shows section + custom label; OFF hides; comments independent', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    const fixture = await createWeddingFixture(page);
    await page.goto(`/editor/${fixture.id}?concept=WEDDING`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('desktop-editor-preview')).toBeVisible({ timeout: 60_000 });

    await goToRsvpStep(page);
    await expect(page.getByTestId('editor-rsvp-button-label')).toBeVisible({ timeout: 30_000 });

    const preview = page.getByTestId('editor-live-preview-viewport');
    await expect(preview.getByTestId('invitation-rsvp-section')).toHaveCount(1, { timeout: 20_000 });
    await expect(preview.getByTestId('invitation-rsvp-cta')).toContainText(CUSTOM_LABEL);

    await page.getByTestId('editor-rsvp-button-label').fill('새 버튼 문구');
    await expect(preview.getByTestId('invitation-rsvp-cta')).toContainText('새 버튼 문구');

    // attendance step 진입 시 Preview가 RSVP로 포커스되는지 확인
    await expect
      .poll(
        async () =>
          preview.evaluate(() => {
            const root = document.querySelector('[data-testid="editor-live-preview-viewport"]');
            const el = root?.querySelector('[data-section-id="rsvp"]');
            if (!root || !el) return false;
            const er = el.getBoundingClientRect();
            const rr = root.getBoundingClientRect();
            return er.top < rr.bottom && er.bottom > rr.top;
          }),
        { timeout: 10_000 }
      )
      .toBeTruthy();

    await page.getByTestId('editor-rsvp-toggle').click();
    await expect(preview.getByTestId('invitation-rsvp-section')).toHaveCount(0, { timeout: 15_000 });
    await expect(preview.getByTestId('invitation-comments-section')).toHaveCount(1);

    await page.getByTestId('editor-rsvp-toggle').click();
    await expect(preview.getByTestId('invitation-rsvp-section')).toHaveCount(1, { timeout: 15_000 });

    await page.getByTestId('editor-comments-toggle').click();
    await expect(preview.getByTestId('invitation-rsvp-section')).toHaveCount(1);
    await expect(preview.getByTestId('invitation-comments-section')).toHaveCount(0);

    expect(pageErrors, `pageerror: ${pageErrors.join(' | ')}`).toEqual([]);
    const noisy = consoleErrors.filter((line) => !/401|favicon|ResizeObserver/i.test(line));
    expect(noisy, `console error: ${noisy.join(' | ')}`).toEqual([]);

    await context.close();
  });

  test('public custom label + CTA opens form; guestCount 4', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const fixture = await createWeddingFixture(page);

    await page.goto(`/i/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('invitation-rsvp-section')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('invitation-rsvp-cta')).toContainText(CUSTOM_LABEL);
    await expect(page.getByTestId('invitation-comments-section')).toBeVisible();

    await page.getByTestId('invitation-rsvp-cta').click();
    const count = page.getByTestId('rsvp-guest-count');
    await expect(count).toBeVisible();
    await count.fill('4');
    await expect(count).toHaveValue('4');

    await context.close();
  });

  test('public 375 and desktop column show RSVP CTA', async ({ browser }) => {
    const fixtureContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const setupPage = await fixtureContext.newPage();
    const fixture = await createWeddingFixture(setupPage);
    await fixtureContext.close();

    for (const width of [375, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 812 } });
      const page = await context.newPage();
      await page.goto(`${FE}/i/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('invitation-rsvp-cta')).toContainText(CUSTOM_LABEL, {
        timeout: 45_000,
      });
      await context.close();
    }

    const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await desktop.newPage();
    await page.goto(`${FE}/i/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('desktop-invitation-column')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('invitation-rsvp-cta')).toContainText(CUSTOM_LABEL);
    await expect(page.getByTestId('desktop-aside-rsvp-cta')).toContainText(CUSTOM_LABEL);
    await desktop.close();
  });

  test('mobile preview modal shows RSVP when enabled', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const fixture = await createWeddingFixture(page);

    await page.goto(`/m/editor/${fixture.id}?concept=WEDDING`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('mobile-editor-layout')).toBeVisible({ timeout: 60_000 });
    await goToRsvpStep(page);

    const previewBtn = page.getByRole('button', { name: /미리보기/ });
    if (await previewBtn.count()) {
      await previewBtn.first().click();
      await expect(page.getByTestId('mobile-preview-overlay')).toBeVisible({ timeout: 20_000 });
      await expect(
        page.getByTestId('mobile-preview-overlay').getByTestId('invitation-rsvp-section')
      ).toHaveCount(1);
      await expect(
        page.getByTestId('mobile-preview-overlay').getByTestId('invitation-rsvp-cta')
      ).toContainText(CUSTOM_LABEL);
    }

    await context.close();
  });

  test('save/reload restores RSVP ON and button label', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const fixture = await createWeddingFixture(page);

    await page.goto(`/editor/${fixture.id}?concept=WEDDING`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await goToRsvpStep(page);
    await page.getByTestId('editor-rsvp-button-label').fill('저장복원문구');
    const saveBtn = page.getByRole('button', { name: /저장/ }).first();
    await saveBtn.click();
    await page.waitForTimeout(1500);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await goToRsvpStep(page);
    await expect(page.getByTestId('editor-rsvp-toggle-input')).toBeChecked({ timeout: 20_000 });
    await expect(page.getByTestId('editor-rsvp-button-label')).toHaveValue('저장복원문구');
    await expect(
      page.getByTestId('editor-live-preview-viewport').getByTestId('invitation-rsvp-cta')
    ).toContainText('저장복원문구');

    await context.close();
  });
});
