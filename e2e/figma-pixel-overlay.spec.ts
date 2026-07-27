/**
 * Figma Make SSOT reference + Railway actual 캡처 및 pixel overlay/diff.
 *
 * - Figma Make은 get_screenshot 미지원 → MCP 소스 수치로 만든 reference HTML 캡처
 * - Railway actual은 동일 viewport / deviceScaleFactor=1 로 캡처
 *
 * env:
 * - PLAYWRIGHT_BASE_URL (default Railway development FE)
 * - E2E_API_BASE_URL
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { test, expect, type Page, type Browser } from '@playwright/test';
import { pathToFileURL } from 'url';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const ROOT = path.resolve(__dirname, '..');
const REF_DIR = path.join(ROOT, 'artifacts/figma-reference');
const ACT_DIR = path.join(ROOT, 'artifacts/railway-actual');
const OUT_DIR = path.join(ROOT, 'artifacts/figma-diff');
const REF_HTML = path.join(ROOT, 'scripts/figma-pixel-qa/figma-reference.html');
const BASELINE = path.join(OUT_DIR, 'baseline.json');

test.setTimeout(240_000);

const VIEWPORTS = {
  mobile375: { width: 375, height: 812 },
  mobile390: { width: 390, height: 844 },
  desktop1023: { width: 1023, height: 768 },
  desktop1024: { width: 1024, height: 768 },
  desktop1440: { width: 1440, height: 1024 },
} as const;

function sh(cmd: string) {
  return execSync(cmd, { encoding: 'utf8', cwd: ROOT }).replace(/^\uFEFF/, '').trim();
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
    captureAt: new Date().toISOString(),
    frontendUrl: FE,
  };
}

async function liveFingerprint(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const html = await page.content();
  const chunk = (html.match(/\/_next\/static\/chunks\/webpack-[a-f0-9]+\.js/) || [])[0] || null;
  return { finalUrl: page.url(), webpackChunk: chunk };
}

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
}

async function ensureFixture(page: Page) {
  const email = `figma-pixel-qa-${Date.now()}@example.com`;
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
            title: '이준혁 ♥ 김지은',
            content: '봄날의 햇살 아래, 결혼합니다.',
            eventDate: '2025-11-15T14:30:00+09:00',
            locationText: '더 웨딩홀 그랜드볼룸 · 서울 강남구',
            rsvpEnabled: true,
            guestbookEnabled: true,
            groomName: '이준혁',
            brideName: '김지은',
            groomPhone: '010-1234-5678',
            bridePhone: '010-9876-5432',
            parentsInfo: '유갑성 · 우재한 의 아들 / 이상금 · 형명숙 의 딸',
            groom: {
              name: '이준혁',
              phone: '010-1234-5678',
              parentsText: '유갑성 · 우재한 의 아들',
              image: '/images/wedding/classic/groom.jpg',
            },
            bride: {
              name: '김지은',
              phone: '010-9876-5432',
              parentsText: '이상금 · 형명숙 의 딸',
              image: '/images/wedding/classic/bride.jpg',
            },
            heroImage: '/images/wedding/classic/hero.jpg',
            galleryImages: [
              '/images/wedding/classic/gallery_01.jpg',
              '/images/wedding/classic/gallery_02.jpg',
            ],
            address: '서울 구로구 경인로 610',
            mapImage: '/images/wedding/classic/map.jpg',
            accounts: [
              { role: '신랑', bank: '국민은행', number: '123456-78-901234', holder: '이준혁' },
              { role: '신부', bank: '신한은행', number: '987654-32-109876', holder: '김지은' },
            ],
            messages: [
              {
                name: '서문교',
                content: '두 분 결혼 축하드려요~ 알콩달콩 이쁘게 잘 살아요^^',
                createdAt: '2025.04.13 17:21',
              },
              {
                name: '스윙 이소영',
                content: '소식 전해줘서 고마워요! 행복하게 잘 살아줘요.',
                createdAt: '2025.04.12 19:45',
              },
            ],
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
  return { id, shareSlug: published.shareSlug as string, email };
}

async function waitReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForTimeout(500);
}

async function captureViewport(
  page: Page,
  filePath: string,
  options?: { fullPage?: boolean; selector?: string }
) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (options?.selector) {
    const loc = page.locator(options.selector).first();
    await expect(loc).toBeVisible({ timeout: 30_000 });
    await loc.screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath, fullPage: Boolean(options?.fullPage) });
  }
  expect(fs.existsSync(filePath)).toBeTruthy();
}

async function captureFigmaReference(browser: Browser) {
  fs.mkdirSync(REF_DIR, { recursive: true });
  const fileUrl = pathToFileURL(REF_HTML).href;
  const shots: Array<{ name: string; screen: string; viewport: keyof typeof VIEWPORTS }> = [
    { name: 'public-mobile-hero-375.png', screen: 'public-mobile-hero', viewport: 'mobile375' },
    { name: 'public-mobile-couple-375.png', screen: 'public-mobile-couple', viewport: 'mobile375' },
    { name: 'public-mobile-guestbook-375.png', screen: 'public-mobile-guestbook', viewport: 'mobile375' },
    { name: 'public-mobile-gallery-375.png', screen: 'public-mobile-gallery', viewport: 'mobile375' },
    { name: 'public-mobile-map-375.png', screen: 'public-mobile-map', viewport: 'mobile375' },
    { name: 'public-mobile-share-375.png', screen: 'public-mobile-share', viewport: 'mobile375' },
    { name: 'editor-desktop-basic-1440.png', screen: 'editor-desktop-basic', viewport: 'desktop1440' },
    { name: 'editor-mobile-basic-375.png', screen: 'editor-mobile-basic', viewport: 'mobile375' },
  ];

  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: VIEWPORTS[shot.viewport],
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(`${fileUrl}?screen=${shot.screen}`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await captureViewport(page, path.join(REF_DIR, shot.name));
    await context.close();
  }
  return shots.length;
}

test.describe('Figma pixel overlay QA', () => {
  test('capture reference + railway actual + diff', async ({ browser }) => {
    fs.mkdirSync(REF_DIR, { recursive: true });
    fs.mkdirSync(ACT_DIR, { recursive: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const deploy = await identifyDeploy();
    const fpPage = await browser.newPage({ viewport: VIEWPORTS.mobile375, deviceScaleFactor: 1 });
    await fpPage.goto(FE, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    const live = await liveFingerprint(fpPage);
    await fpPage.close();

    const refCount = await captureFigmaReference(browser);

    const setup = await browser.newPage({ viewport: VIEWPORTS.mobile375, deviceScaleFactor: 1 });
    setup.setDefaultNavigationTimeout(90_000);
    await setup.goto(FE, { waitUntil: 'domcontentloaded' });
    const fixture = await ensureFixture(setup);
    await setup.close();

    // Public mobile sections
    {
      const context = await browser.newContext({
        baseURL: FE,
        viewport: VIEWPORTS.mobile375,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.addInitScript(() => localStorage.setItem('language', 'ko'));
      await page.goto(`/i/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await waitReady(page);
      await page.waitForSelector('img', { timeout: 30_000 }).catch(() => undefined);
      await page.evaluate(() => {
        document.querySelectorAll('img').forEach((img) => {
          if ((img as HTMLImageElement).complete) return;
        });
      });

      await captureViewport(page, path.join(ACT_DIR, 'public-mobile-hero-375.png'));

      const couple = page.getByTestId('couple-section');
      if (await couple.count()) {
        await couple.scrollIntoViewIfNeeded();
        await waitReady(page);
        await captureViewport(page, path.join(ACT_DIR, 'public-mobile-couple-375.png'), {
          selector: '[data-testid="couple-section"]',
        });
      }

      const guestbook = page.getByTestId('guestbook-section');
      if (await guestbook.count()) {
        await guestbook.scrollIntoViewIfNeeded();
        await waitReady(page);
        await captureViewport(page, path.join(ACT_DIR, 'public-mobile-guestbook-375.png'), {
          selector: '[data-testid="guestbook-section"]',
        });
      }

      const gallery = page.locator('[aria-label="Album"]').first();
      if (await gallery.count()) {
        await gallery.scrollIntoViewIfNeeded();
        await waitReady(page);
        await captureViewport(page, path.join(ACT_DIR, 'public-mobile-gallery-375.png'), {
          selector: '[aria-label="Album"]',
        });
      }

      const map = page.locator('text=위치 안내').first();
      if (await map.count()) {
        await map.scrollIntoViewIfNeeded();
        await waitReady(page);
        await captureViewport(page, path.join(ACT_DIR, 'public-mobile-map-375.png'));
      }

      const share = page.locator('text=공유하기').first();
      if (await share.count()) {
        await share.scrollIntoViewIfNeeded();
        await waitReady(page);
        await captureViewport(page, path.join(ACT_DIR, 'public-mobile-share-375.png'));
      }

      // Banner must not appear on editor after publish
      await loginInBrowser(page, fixture.email);
      await page.goto(`/editor/${fixture.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await waitReady(page);
      await expect(page.getByTestId('share-panel')).toHaveCount(0);
      await captureViewport(page, path.join(ACT_DIR, 'editor-mobile-basic-375.png'));
      await context.close();
    }

    // Desktop editor / public
    {
      const context = await browser.newContext({
        baseURL: FE,
        viewport: VIEWPORTS.desktop1440,
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.addInitScript(() => localStorage.setItem('language', 'ko'));
      await loginInBrowser(page, fixture.email);
      await page.goto(`/editor/${fixture.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await waitReady(page);
      await expect(page.getByTestId('share-panel')).toHaveCount(0);
      await captureViewport(page, path.join(ACT_DIR, 'editor-desktop-basic-1440.png'));

      await page.goto(`/i/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await waitReady(page);
      await captureViewport(page, path.join(ACT_DIR, 'public-desktop-1440.png'), { fullPage: true });
      await context.close();
    }

    // 1023 / 1024 breakpoint smoke captures
    for (const [name, viewport] of [
      ['breakpoint-1023.png', VIEWPORTS.desktop1023],
      ['breakpoint-1024.png', VIEWPORTS.desktop1024],
    ] as const) {
      const context = await browser.newContext({
        baseURL: FE,
        viewport,
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await loginInBrowser(page, fixture.email);
      await page.goto(`/editor/${fixture.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await waitReady(page);
      await captureViewport(page, path.join(ACT_DIR, name));
      await context.close();
    }

    const reportRaw = sh('node scripts/figma-pixel-qa/pixel-diff.mjs');
    const diffSummary = JSON.parse(reportRaw);

    fs.writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          ...deploy,
          live,
          fixture: { id: fixture.id, shareSlug: fixture.shareSlug },
          referenceCount: refCount,
          actualFiles: fs.readdirSync(ACT_DIR).filter((f) => f.endsWith('.png')),
          referenceFiles: fs.readdirSync(REF_DIR).filter((f) => f.endsWith('.png')),
          diffSummary,
        },
        null,
        2
      ),
      'utf8'
    );

    expect(refCount).toBeGreaterThan(0);
    expect(fs.readdirSync(ACT_DIR).filter((f) => f.endsWith('.png')).length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(OUT_DIR, 'diff-report.json'))).toBeTruthy();
  });
});
