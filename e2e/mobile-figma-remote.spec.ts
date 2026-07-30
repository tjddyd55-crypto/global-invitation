import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Railway development 원격 모바일 Figma QA.
 * PLAYWRIGHT_BASE_URL=https://frontend-development-1b8a.up.railway.app
 */

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const OUT = path.resolve(__dirname, '../artifacts/design-qa-remote');
const REPORT = path.join(OUT, 'capture-report.json');

test.setTimeout(180_000);
test.use({
  baseURL: FE,
  storageState: { cookies: [], origins: [] },
});

function sh(cmd: string) {
  return execSync(cmd, { encoding: 'utf8' }).replace(/^\uFEFF/, '').trim();
}

async function identifyDeploy() {
  const list = JSON.parse(sh('railway deployment list -s Frontend -e development --json'));
  const deployments = Array.isArray(list) ? list : list.deployments || [];
  const success = deployments.find((d: { status: string }) => d.status === 'SUCCESS') || deployments[0];
  return {
    deploymentId: success?.id ?? null,
    status: success?.status ?? null,
    createdAt: success?.createdAt ?? null,
    imageDigest: success?.meta?.imageDigest ?? null,
    localHead: sh('git rev-parse HEAD'),
  };
}

async function liveFingerprint(page: Page) {
  await page.goto('/m', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const finalUrl = page.url();
  const html = await page.content();
  const chunk = (html.match(/\/_next\/static\/chunks\/webpack-[a-f0-9]+\.js/) || [])[0] || null;
  return { finalUrl, webpackChunk: chunk };
}

async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  return metrics;
}

async function assertFormInViewport(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box).toBeTruthy();
  if (!box) return null;
  const vw = page.viewportSize()?.width ?? 375;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
  return box;
}

async function loginInBrowser(page: Page, email: string) {
  const res = await page.request.post(`${API}/api/test-login`, {
    data: { email },
  });
  expect(res.ok(), `test-login HTTP ${res.status()}`).toBeTruthy();

  const cookies = await page.context().cookies(API);
  const auth = cookies.find((c) => c.name === 'auth_session_token');
  expect(auth, 'auth_session_token missing').toBeTruthy();

  // Railway FE/BE are different hosts; Chromium blocks Lax cross-site cookies on fetch.
  // Re-inject as SameSite=None; Secure so page fetch(credentials) can authenticate.
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

async function ensureEditorFixture(page: Page) {
  const email = `mobile-figma-qa-${Date.now()}@example.com`;
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
    async ({ api, id }) => {
      await fetch(`${api}/api/invitations/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '이준혁 ♥ 김지은',
          data: {
            templateType: 'FULL',
            conceptType: 'WEDDING',
            rsvp: { enabled: true },
          },
        }),
      });
      const pub = await fetch(`${api}/api/invitations/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      const body = await pub.json();
      const detail = await fetch(`${api}/api/invitations/${id}`, { credentials: 'include' });
      const detailBody = await detail.json();
      return {
        ok: pub.ok,
        shareSlug: body.shareSlug || body.share_slug || detailBody.shareSlug,
      };
    },
    { api: API, id }
  );
  expect(published.ok).toBeTruthy();
  expect(published.shareSlug).toBeTruthy();

  return {
    id,
    shareSlug: published.shareSlug as string,
    email,
  };
}

async function prepareMobile(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('language', 'ko');
  });
}

test.describe('Railway mobile Figma QA', () => {
  let deployInfo: Awaited<ReturnType<typeof identifyDeploy>>;
  let fingerprint: Awaited<ReturnType<typeof liveFingerprint>>;
  let fixture: Awaited<ReturnType<typeof ensureEditorFixture>>;

  test.beforeAll(async ({ browser }) => {
    fs.mkdirSync(OUT, { recursive: true });
    deployInfo = await identifyDeploy();
    const page = await browser.newPage();
    fingerprint = await liveFingerprint(page);
    fixture = await ensureEditorFixture(page);
    await page.close();

    fs.writeFileSync(
      REPORT,
      JSON.stringify(
        {
          screenshotRunAt: new Date().toISOString(),
          frontendUrl: FE,
          backendUrl: API,
          deploy: deployInfo,
          live: fingerprint,
          fixture: { id: fixture.id, shareSlug: fixture.shareSlug },
        },
        null,
        2
      ),
      'utf8'
    );
  });

  test('375 concept + editor assertions + captures', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
      baseURL: FE,
    });
    const page = await context.newPage();
    await prepareMobile(page);
    await loginInBrowser(page, fixture.email);

    // Concept
    await page.goto('/m/templates', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForURL(/\/m\/templates/, { timeout: 30_000 });
    await expect(page.getByTestId('mobile-concept-screen')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
    const conceptOverflow = await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(OUT, 'mobile-concept-375.png'), fullPage: false });

    // Editor step 0
    const consoleErrors: string[] = [];
    const failedApis: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(`pageerror:${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console:${msg.text()}`);
    });
    page.on('response', (res) => {
      const url = res.url();
      if (!url.includes(API)) return;
      if (res.status() >= 400) failedApis.push(`${res.status()} ${url}`);
    });

    await page.goto(`/m/editor/${fixture.id}?concept=WEDDING`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await page.waitForURL(new RegExp(`/m/editor/${fixture.id}`), { timeout: 60_000 });
    await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('mobile-editor-layout')).toBeVisible();
    await expect(page.getByTestId('mobile-editor-stepper')).toBeVisible();
    await expect(page.getByTestId('mobile-editor-actions')).toBeVisible();
    await expect(page.getByTestId('desktop-editor-sidebar')).toHaveCount(0);
    await expect(page.getByTestId('desktop-editor-preview')).toHaveCount(0);
    await expect(page.getByTestId('desktop-editor-layout')).toHaveCount(0);
    await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);

    const rootBox = await page.getByTestId('wedding-editor-root').boundingBox();
    expect(rootBox?.width).toBeGreaterThanOrEqual(374);

    const firstStep = page.getByTestId('stepper-item-0');
    await expect(firstStep).toBeVisible();
    const firstStepBox = await firstStep.boundingBox();
    expect(firstStepBox).toBeTruthy();
    expect(firstStepBox!.x).toBeGreaterThanOrEqual(16);

    const stepperScrollLeft = await page
      .getByTestId('unified-stepper-horizontal')
      .evaluate((el) => (el as HTMLElement).scrollLeft);
    expect(stepperScrollLeft).toBe(0);

    const formBox0 = await assertFormInViewport(page, '[data-testid="mobile-editor-form"]');
    const editorOverflow0 = await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(OUT, 'mobile-editor-step0-375.png'), fullPage: false });

    // Step 1
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByTestId('mobile-editor-form')).toBeVisible();
    const formBox1 = await assertFormInViewport(page, '[data-testid="mobile-editor-form"]');
    await page.screenshot({ path: path.join(OUT, 'mobile-editor-step1-375.png'), fullPage: false });

    // Jump to share settings (last step) via stepper if present
    const shareStep = page.getByTestId('stepper-item-9');
    if (await shareStep.count()) {
      await shareStep.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, 'mobile-share-settings-375.png'), fullPage: false });
    }

    // Preview
    await page.getByRole('button', { name: '미리보기' }).first().click();
    await expect(page.getByTestId('mobile-preview-overlay')).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(OUT, 'mobile-preview-375.png'), fullPage: false });
    await page.getByLabel('미리보기 닫기').click();

    const appConsoleErrors = consoleErrors.filter(
      (line) =>
        !/extension|chrome-extension|Failed to load resource:.*favicon/i.test(line) &&
        !/Download the React DevTools/i.test(line)
    );
    const appFailedApis = failedApis.filter((line) => !/\/api\/test-login/i.test(line));
    expect(appConsoleErrors, JSON.stringify(appConsoleErrors)).toEqual([]);
    expect(appFailedApis, JSON.stringify(appFailedApis)).toEqual([]);

    // Publish complete
    await page.goto(`/m/my-invitations/${fixture.id}/complete`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await page.waitForURL(new RegExp(`/m/my-invitations/${fixture.id}/complete`), {
      timeout: 60_000,
    });
    await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
    await page.screenshot({ path: path.join(OUT, 'mobile-publish-375.png'), fullPage: false });

    // Public invite bottom nav (not in MobileShell)
    await page.goto(`/i/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);

    // Allowed route shows nav
    await page.goto('/m', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();

    const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
    report.viewport375 = {
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
      conceptOverflow,
      editorOverflow0,
      formBox0,
      formBox1,
      firstStepBox,
      stepperScrollLeft,
      rootWidth: rootBox?.width ?? null,
      consoleErrors: appConsoleErrors,
      failedApis: appFailedApis,
      finalUrls: {
        concept: `${FE}/m/templates`,
        editor: `${FE}/m/editor/${fixture.id}?concept=WEDDING`,
      },
    };
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf8');

    await context.close();
  });

  test('390 concept + editor captures', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
      baseURL: FE,
    });
    const page = await context.newPage();
    await prepareMobile(page);
    await loginInBrowser(page, fixture.email);

    await page.goto('/m/templates', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('mobile-concept-screen')).toBeVisible({ timeout: 30_000 });
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(OUT, 'mobile-concept-390.png'), fullPage: false });

    await page.goto(`/m/editor/${fixture.id}?concept=WEDDING`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('mobile-editor-layout')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('desktop-editor-sidebar')).toHaveCount(0);
    await assertFormInViewport(page, '[data-testid="mobile-editor-form"]');
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(OUT, 'mobile-editor-step0-390.png'), fullPage: false });

    await page.getByRole('button', { name: '다음' }).click();
    await page.screenshot({ path: path.join(OUT, 'mobile-editor-step1-390.png'), fullPage: false });

    const shareStep390 = page.getByTestId('stepper-item-9');
    if (await shareStep390.count()) {
      await shareStep390.click();
      await page.waitForTimeout(400);
      await assertNoHorizontalOverflow(page);
      await page.screenshot({ path: path.join(OUT, 'mobile-share-settings-390.png'), fullPage: false });
    }

    await context.close();
  });

  test('desktop regression captures', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1024 },
      baseURL: FE,
    });
    const page = await context.newPage();
    await prepareMobile(page);
    await loginInBrowser(page, fixture.email);

    await page.goto('/pc/templates', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('concept-start-cta')).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(OUT, 'desktop-concept-1440.png'), fullPage: false });

    await page.goto(`/pc/editor/${fixture.id}?concept=WEDDING`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('desktop-editor-sidebar')).toBeVisible();
    await expect(page.getByTestId('desktop-editor-preview')).toBeVisible();
    await expect(page.getByTestId('mobile-editor-layout')).toHaveCount(0);
    await page.screenshot({ path: path.join(OUT, 'desktop-editor-1440.png'), fullPage: false });

    await page.goto(`/pc/my-invitations/${fixture.id}/complete`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await page.screenshot({ path: path.join(OUT, 'desktop-publish-1440.png'), fullPage: false });

    await page.goto(`/i/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.screenshot({ path: path.join(OUT, 'desktop-public-1440.png'), fullPage: false });

    await context.close();
  });
});
