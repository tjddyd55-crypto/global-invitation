/**
 * GENERAL editor preview section navigation smoke (development).
 * Run: npx playwright test e2e/general-editor-preview-nav.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.setTimeout(300_000);

const STEP_SECTION: Array<{ label: string; sectionId: string }> = [
  { label: '기본 정보', sectionId: 'basic' },
  { label: '행사 소개', sectionId: 'greeting' },
  { label: '대표 이미지', sectionId: 'hero' },
  { label: '일정', sectionId: 'schedule' },
  { label: '갤러리', sectionId: 'gallery' },
  { label: '위치 안내', sectionId: 'location' },
  { label: '참가비·계좌 정보', sectionId: 'accounts' },
  { label: '참석 여부', sectionId: 'rsvp' },
  { label: '음악 설정', sectionId: 'music' },
  { label: '공유 설정', sectionId: 'share' },
];

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

async function createGeneralDraft(page: Page) {
  return page.evaluate(async ({ api }) => {
    const res = await fetch(`${api}/api/invitations`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conceptType: 'GENERAL',
        language: 'ko',
        templateKey: 'invitation_full',
      }),
    });
    const body = await res.json();
    return { ok: res.ok, id: body.id as string, body };
  }, { api: API });
}

test('GENERAL preview has anchors for all 10 steps and scrolls on step click', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `general-nav-${Date.now()}@example.com`;
  await loginInBrowser(page, email);
  const created = await createGeneralDraft(page);
  expect(created.ok, JSON.stringify(created.body)).toBeTruthy();

  await page.goto(`${FE}/editor/${created.id}?concept=GENERAL`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await expect(page.getByTestId('editor-live-preview-panel')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);

  // Patch intro quote + body via UI so introduction content is visible
  await page.getByRole('button', { name: /행사 소개/ }).first().click();
  await page.waitForTimeout(400);
  await page.locator('input[placeholder*="예쁜 예감"]').fill('함께해 주세요');
  await page.locator('textarea').first().fill('일반 행사 소개 본문입니다.\n두 번째 줄');
  await page.waitForTimeout(800);

  const previewRoot = page.locator('[data-testid="editor-live-preview-panel"]');
  for (const step of STEP_SECTION) {
    await page.getByRole('button', { name: new RegExp(step.label) }).first().click();
    await page.waitForTimeout(900);
    const target = previewRoot.locator(`[data-section-id="${step.sectionId}"]`).first();
    await expect(target, `missing section ${step.sectionId} for ${step.label}`).toHaveCount(1);

    const aligned = await page.evaluate((sectionId) => {
      const scrollRoot = document.querySelector(
        '[data-testid="editor-live-preview-viewport"]'
      );
      const section = document.querySelector(
        `[data-testid="editor-live-preview-viewport"] [data-section-id="${sectionId}"]`
      );
      if (!(scrollRoot instanceof HTMLElement) || !(section instanceof HTMLElement)) {
        return { ok: false, reason: 'missing-dom' };
      }
      const rootRect = scrollRoot.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const delta = Math.abs(sectionRect.top - rootRect.top - 12);
      const atBottom =
        scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 4;
      // 문서 끝 섹션은 max scroll 후에도 top 정렬이 불가할 수 있어 atBottom 허용
      return {
        ok: delta < 100 || (atBottom && sectionRect.top < rootRect.bottom),
        delta,
        atBottom,
        sectionTop: sectionRect.top,
        rootTop: rootRect.top,
      };
    }, step.sectionId);

    expect(aligned.ok, `${step.label} scroll delta=${JSON.stringify(aligned)}`).toBeTruthy();
  }

  // Re-click accounts to ensure scrollRequestId works
  await page.getByRole('button', { name: /참가비·계좌 정보/ }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /참가비·계좌 정보/ }).first().click();
  await page.waitForTimeout(700);
  await expect(previewRoot.locator('[data-section-id="accounts"]').first()).toHaveCount(1);

  // Intro quote visible in preview
  await expect(previewRoot.getByText('함께해 주세요')).toBeVisible();
  await expect(previewRoot.getByText('일반 행사 소개 본문입니다.')).toBeVisible();

  // Step 1 exposes the same SSOT fields (title/datetime/venue)
  await page.getByRole('button', { name: /기본 정보/ }).first().click();
  await page.waitForTimeout(400);
  await expect(page.getByTestId('basic-title-input')).toBeVisible();
  await expect(page.getByTestId('basic-datetime-input')).toBeVisible();
  await expect(page.getByTestId('basic-datetime-picker-button')).toBeVisible();
  await expect(page.getByTestId('basic-venue-input')).toBeVisible();

  const nextDate = '2025-04-13T17:20';
  await page.getByTestId('basic-datetime-input').fill(nextDate);
  await page.getByTestId('basic-venue-input').fill('코엑스 컨퍼런스홀');
  await page.waitForTimeout(600);

  // Schedule step shares the same SSOT values
  await page.getByRole('button', { name: /^.*일정$/ }).first().click();
  await page.waitForTimeout(500);
  await expect(page.getByTestId('schedule-datetime-input')).toHaveValue(nextDate);
  await expect(page.getByTestId('schedule-venue-input')).toHaveValue('코엑스 컨퍼런스홀');
  await expect(page.getByTestId('schedule-datetime-picker-button')).toBeVisible();

  // Preview shows shared calendar card (not text-only list)
  await expect(previewRoot.getByTestId('general-schedule')).toBeVisible();
  await expect(previewRoot.getByTestId('schedule-calendar-highlight')).toHaveText('13');

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  await context.close();
});
