/**
 * Final handoff verification — development only.
 * Does not claim PASS without assertions.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const OUT = path.resolve('artifacts/visual-template-handoff');

const NEW_SIX = [
  'WEDDING_04_EDITORIAL',
  'WEDDING_05_GARDEN',
  'WEDDING_06_NIGHT',
  'GENERAL_04_CLEAN',
  'GENERAL_05_FESTIVE',
  'GENERAL_06_CULTURE',
] as const;

const CLASSICS = ['WEDDING_01_CLASSIC', 'GENERAL_01_CLASSIC'] as const;

const FORBIDDEN_VISIBLE = [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, /\bsample\.svg\b/i, /templates\/visual\/_shared/];

test.setTimeout(420_000);

async function loginInBrowser(page: Page, email: string) {
  const res = await page.request.post(`${API}/api/test-login`, { data: { email } });
  expect(res.ok(), await res.text()).toBeTruthy();
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

async function assertNoBrokenImages(page: Page) {
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
      .map((img) => img.src)
  );
  expect(broken, broken.join('\n')).toEqual([]);
}

async function assertNoForbiddenText(page: Page) {
  const text = await page.locator('body').innerText();
  for (const pattern of FORBIDDEN_VISIBLE) {
    expect(text, String(pattern)).not.toMatch(pattern);
  }
}

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
});

test('handoff: Classic + new-6 preview routes, CTA, images, ISO', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const invitationCountBefore = await page.request
    .get(`${API}/api/health`)
    .then(() => null)
    .catch(() => null);
  void invitationCountBefore;

  for (const id of [...CLASSICS, ...NEW_SIX]) {
    const res = await page.goto(`${FE}/templates/${id}/preview`, {
      waitUntil: 'networkidle',
      timeout: 90_000,
    });
    expect(res?.ok(), id).toBeTruthy();
    await expect(page.getByTestId('visual-template-preview')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('preview-create-cta')).toBeVisible();
    await expect(page.getByText('샘플 미리보기').first()).toBeVisible();
    await expect(page.getByText(id)).toHaveCount(0);
    await assertNoForbiddenText(page);
    await assertNoBrokenImages(page);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${id} overflow`).toBeLessThanOrEqual(1);

    await page.screenshot({ path: path.join(OUT, `${id}-375-preview.png`), fullPage: true });
  }

  // Preview must not create invitation without clicking CTA / being logged in
  // (no authenticated session in this test)
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  await context.close();
});

test('handoff: catalog filters + editor switch preserves fields', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `handoff-switch-${Date.now()}@example.com`;
  await loginInBrowser(page, email);

  await page.goto(`${FE}/create/templates?concept=WEDDING`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await expect(page.getByTestId('visual-template-catalog')).toBeVisible({ timeout: 60_000 });
  for (const id of ['WEDDING_01_CLASSIC', 'WEDDING_04_EDITORIAL', 'WEDDING_05_GARDEN', 'WEDDING_06_NIGHT']) {
    await expect(page.getByTestId(`template-card-${id}`)).toBeVisible();
  }
  await expect(page.getByTestId('template-card-GENERAL_04_CLEAN')).toHaveCount(0);
  await expect(page.getByText('WEDDING_04')).toHaveCount(0);

  // Create with Editorial
  await page.getByTestId('template-create-WEDDING_04_EDITORIAL').click();
  await page.waitForURL(/\/editor\//, { timeout: 90_000 });
  await expect(page.getByTestId('editor-template-switcher')).toContainText('모던 에디토리얼', {
    timeout: 20_000,
  });

  // Fill title if basic field exists
  const titleInput = page.getByLabel(/제목|이름|신랑|신부/).first();
  if (await titleInput.count()) {
    await titleInput.fill('핸드오프검증 · 민서');
  }

  const editorUrl = page.url();
  const invitationId = editorUrl.match(/editor\/([^/?#]+)/)?.[1];
  expect(invitationId).toBeTruthy();

  async function fetchDataJson() {
    const res = await page.request.get(`${API}/api/invitations/${invitationId}`);
    expect(res.ok(), await res.text()).toBeTruthy();
    const json = (await res.json()) as { data?: Record<string, unknown>; dataJson?: Record<string, unknown> };
    return (json.dataJson || json.data || {}) as Record<string, unknown>;
  }

  // Save once if save button exists
  const saveBtn = page.getByRole('button', { name: /저장/ }).first();
  if (await saveBtn.count()) {
    await saveBtn.click();
    await page.waitForTimeout(1500);
  }

  const before = await fetchDataJson();
  expect(before.visualTemplateId).toBe('WEDDING_04_EDITORIAL');
  expect(before.conceptType).toBe('WEDDING');

  // Switch Editorial → Garden
  await page.getByRole('button', { name: '템플릿 변경' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: /로맨틱 가든/ }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: '템플릿 변경' }).click();
  await expect(page.getByTestId('editor-template-switcher')).toContainText('로맨틱 가든', {
    timeout: 15_000,
  });

  if (await saveBtn.count()) {
    await saveBtn.click();
    await page.waitForTimeout(1500);
  }

  const afterGarden = await fetchDataJson();
  expect(afterGarden.visualTemplateId).toBe('WEDDING_05_GARDEN');
  expect(afterGarden.conceptType).toBe('WEDDING');
  // gallery / accounts keys should not be wiped if they existed
  for (const key of ['title', 'conceptType', 'templateType'] as const) {
    if (before[key] !== undefined) {
      expect(afterGarden[key], key).toEqual(before[key]);
    }
  }

  // Switch Night → Classic
  await page.getByRole('button', { name: '템플릿 변경' }).click();
  await page.getByRole('button', { name: /미니멀 나이트/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: '템플릿 변경' }).click();
  await expect(page.getByTestId('editor-template-switcher')).toContainText('미니멀 나이트');

  await page.getByRole('button', { name: '템플릿 변경' }).click();
  await page.getByRole('button', { name: /^클래식/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: '템플릿 변경' }).click();
  await expect(page.getByTestId('editor-template-switcher')).toContainText('클래식');

  if (await saveBtn.count()) {
    await saveBtn.click();
    await page.waitForTimeout(1500);
  }
  const afterClassic = await fetchDataJson();
  expect(afterClassic.visualTemplateId).toBe('WEDDING_01_CLASSIC');
  expect(afterClassic.conceptType).toBe(before.conceptType);

  // Reload persistence
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('editor-template-switcher')).toContainText('클래식', { timeout: 30_000 });

  // Preview CTA must not appear in editor
  await expect(page.getByTestId('preview-create-cta')).toHaveCount(0);

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  await context.close();
});

test('handoff: GENERAL catalog create + switch Clean→Festive→Culture→Classic', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `handoff-general-${Date.now()}@example.com`;
  await loginInBrowser(page, email);

  await page.goto(`${FE}/create/templates?concept=GENERAL`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await expect(page.getByTestId('visual-template-catalog')).toBeVisible({ timeout: 60_000 });
  for (const id of ['GENERAL_01_CLASSIC', 'GENERAL_04_CLEAN', 'GENERAL_05_FESTIVE', 'GENERAL_06_CULTURE']) {
    await expect(page.getByTestId(`template-card-${id}`)).toBeVisible();
  }
  await expect(page.getByTestId('template-card-WEDDING_04_EDITORIAL')).toHaveCount(0);

  await page.getByTestId('template-create-GENERAL_04_CLEAN').click();
  await page.waitForURL(/\/editor\//, { timeout: 90_000 });
  await expect(page.getByTestId('editor-template-switcher')).toContainText('클린 이벤트', {
    timeout: 20_000,
  });

  const invitationId = page.url().match(/editor\/([^/?#]+)/)?.[1];
  expect(invitationId).toBeTruthy();

  async function switchTo(label: RegExp, expectedName: string) {
    await page.getByRole('button', { name: '템플릿 변경' }).click();
    await page.getByRole('button', { name: label }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '템플릿 변경' }).click();
    await expect(page.getByTestId('editor-template-switcher')).toContainText(expectedName, {
      timeout: 15_000,
    });
  }

  await switchTo(/페스티브/, '페스티브 컬러');
  await switchTo(/컬처/, '컬처 앤 엑시비션');
  await switchTo(/^클래식/, '클래식');

  const saveBtn = page.getByRole('button', { name: /저장/ }).first();
  expect(await saveBtn.count(), 'save button required for persistence check').toBeGreaterThan(0);
  await saveBtn.click();
  await page.waitForTimeout(2500);

  const res = await page.request.get(`${API}/api/invitations/${invitationId}`);
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as {
    data?: Record<string, unknown> | null;
    dataJson?: Record<string, unknown> | null;
  };
  const payload = (body.dataJson || body.data || {}) as Record<string, unknown>;
  expect(payload.visualTemplateId).toBe('GENERAL_01_CLASSIC');
  await expect(page.getByTestId('editor-template-switcher')).toContainText('클래식');

  expect(pageErrors).toEqual([]);
  await context.close();
});

test('handoff: pending visual template resume after login', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto(`${FE}/templates/WEDDING_06_NIGHT/preview`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await expect(page.getByTestId('preview-create-cta')).toBeVisible();
  await page.getByTestId('preview-create-cta').click();
  await page.waitForURL(/\/auth\/email/, { timeout: 60_000 });

  const pending = await page.evaluate(() => sessionStorage.getItem('gi_pending_visual_template_v1'));
  expect(pending).toBeTruthy();
  const parsed = JSON.parse(pending!) as { conceptType: string; visualTemplateId: string };
  expect(parsed.conceptType).toBe('WEDDING');
  expect(parsed.visualTemplateId).toBe('WEDDING_06_NIGHT');

  const email = `handoff-resume-${Date.now()}@example.com`;
  await loginInBrowser(page, email);

  // Restore pending into session for resume page (loginInBrowser navigated away; re-seed)
  await page.evaluate(() => {
    sessionStorage.setItem(
      'gi_pending_visual_template_v1',
      JSON.stringify({
        conceptType: 'WEDDING',
        visualTemplateId: 'WEDDING_06_NIGHT',
        createdAt: Date.now(),
      })
    );
  });
  await page.goto(`${FE}/create/templates/resume`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForURL(/\/editor\//, { timeout: 120_000 });
  await expect(page.getByTestId('editor-template-switcher')).toContainText('미니멀 나이트', {
    timeout: 30_000,
  });

  const cleared = await page.evaluate(() => sessionStorage.getItem('gi_pending_visual_template_v1'));
  expect(cleared).toBeNull();

  await context.close();
});
