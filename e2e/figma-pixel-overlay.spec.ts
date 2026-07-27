/**
 * Figma Pixel QA — Layout Reference Mode (primary verdict).
 *
 * Principles:
 * - Same fixture data for reference HTML and Railway actual
 * - Same font stack (Noto Sans KR)
 * - Solid placeholders for Hero/Couple/Gallery/Map (layout mode)
 * - Masked mismatch is the PASS/FAIL metric
 * - Real-asset pixel mismatch is NOT used as primary verdict
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { test, expect, type Page, type Browser, type Locator } from '@playwright/test';
import { pathToFileURL } from 'url';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const ROOT = path.resolve(__dirname, '..');
const QA_ROOT = path.join(ROOT, 'artifacts/figma-pixel-qa');
const REF_DIR = path.join(QA_ROOT, 'reference');
const ACT_DIR = path.join(QA_ROOT, 'actual');
const REPORTS_DIR = path.join(QA_ROOT, 'reports');
const REF_HTML = path.join(ROOT, 'scripts/figma-pixel-qa/layout-reference.html');
const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/figma-pixel-qa/sample-fixture.json'), 'utf8')
);

test.setTimeout(300_000);

const VIEWPORTS = {
  mobile375: { width: 375, height: 812 },
  desktop1440: { width: 1440, height: 1024 },
} as const;

const LAYOUT_COLORS = FIXTURE.layoutColors as {
  hero: string;
  couple: string;
  gallery: string;
  map: string;
};

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
  const email = `figma-layout-qa-${Date.now()}@example.com`;
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
    async ({ api, id, fixture }) => {
      await fetch(`${api}/api/invitations/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fixture.title,
          data: {
            templateType: 'FULL',
            conceptType: 'WEDDING',
            title: fixture.title,
            content: fixture.greeting,
            eventDate: fixture.eventDate,
            locationText: fixture.locationText,
            schedule: [fixture.eventDateLabel],
            rsvpEnabled: true,
            guestbookEnabled: true,
            groomName: fixture.groomName,
            brideName: fixture.brideName,
            groomPhone: fixture.groomPhone,
            bridePhone: fixture.bridePhone,
            parentsInfo: `${fixture.groomParents} / ${fixture.brideParents}`,
            groom: {
              name: fixture.groomName,
              phone: fixture.groomPhone,
              parentsText: fixture.groomParents,
              image: fixture.assets.groom,
            },
            bride: {
              name: fixture.brideName,
              phone: fixture.bridePhone,
              parentsText: fixture.brideParents,
              image: fixture.assets.bride,
            },
            heroImage: fixture.assets.hero,
            galleryImages: fixture.assets.gallery,
            address: fixture.address,
            mapImage: fixture.assets.map,
            accounts: fixture.accounts,
            messages: fixture.messages,
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
    { api: API, id, fixture: FIXTURE }
  );
  expect(published.ok).toBeTruthy();
  expect(published.shareSlug).toBeTruthy();
  return { id, shareSlug: published.shareSlug as string, email };
}

async function waitFonts(page: Page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForTimeout(300);
}

/** Replace media with solid layout placeholders; unify font stack. */
async function enableLayoutMode(page: Page) {
  await page.addStyleTag({
    content: `
      html, body, * {
        font-family: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif !important;
      }
      [data-testid="couple-section"] img,
      [data-testid="couple-section"] [class*="couplePhoto"],
      [data-testid="couple-section"] [class*="coupleAvatarFallback"] {
        opacity: 0 !important;
      }
      [data-testid="couple-section"] [class*="couplePhotoFrame"] {
        background: ${LAYOUT_COLORS.couple} !important;
        box-shadow: 0 6px 24px rgba(181,112,74,.16) !important;
      }
      [aria-label="Album"] img,
      [aria-label="Album"] [class*="galleryMainImage"] {
        opacity: 0 !important;
      }
      [aria-label="Album"] [class*="galleryCarousel"],
      [aria-label="Album"] [class*="galleryMainImage"] {
        background: ${LAYOUT_COLORS.gallery} !important;
      }
      [class*="heroMedia"] img,
      [class*="heroImage"],
      section[aria-label="대표 이미지"] img {
        opacity: 0 !important;
      }
      section[aria-label="대표 이미지"],
      [class*="heroSection"],
      [class*="heroMedia"] {
        background: ${LAYOUT_COLORS.hero} !important;
      }
      [class*="mapImage"],
      img[alt="지도"],
      img[alt="Map"] {
        opacity: 0 !important;
      }
      [class*="mapImage"] {
        background: ${LAYOUT_COLORS.map} !important;
        min-height: 280px !important;
      }
    `,
  });
  await page.addStyleTag({
    url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap',
  }).catch(() => undefined);
  await waitFonts(page);
}

async function capture(page: Page, filePath: string, locator?: Locator) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (locator) {
    await expect(locator).toBeVisible({ timeout: 30_000 });
    await locator.screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath, fullPage: false });
  }
  expect(fs.existsSync(filePath)).toBeTruthy();
}

async function writeMasks(name: string, masks: Array<{ x: number; y: number; w: number; h: number; kind: string }>) {
  const metaPath = path.join(ACT_DIR, name.replace(/\.png$/i, '.masks.json'));
  fs.writeFileSync(metaPath, JSON.stringify(masks, null, 2), 'utf8');
}

async function masksRelativeTo(root: Locator, selectors: Array<{ sel: string; kind: string }>) {
  const rootBox = await root.boundingBox();
  if (!rootBox) return [];
  const masks: Array<{ x: number; y: number; w: number; h: number; kind: string }> = [];
  for (const item of selectors) {
    const nodes = root.locator(item.sel);
    const count = await nodes.count();
    for (let i = 0; i < count; i += 1) {
      const box = await nodes.nth(i).boundingBox();
      if (!box) continue;
      masks.push({
        x: box.x - rootBox.x,
        y: box.y - rootBox.y,
        w: box.width,
        h: box.height,
        kind: item.kind,
      });
    }
  }
  return masks;
}

async function captureFigmaReference(browser: Browser) {
  fs.mkdirSync(REF_DIR, { recursive: true });
  const fileUrl = pathToFileURL(REF_HTML).href;
  const shots: Array<{
    name: string;
    screen: string;
    viewport: keyof typeof VIEWPORTS;
    selector?: string;
  }> = [
    { name: 'public-hero-375.png', screen: 'public-hero', viewport: 'mobile375', selector: '[data-testid="ref-hero"]' },
    { name: 'public-couple-375.png', screen: 'public-couple', viewport: 'mobile375', selector: '[data-testid="ref-couple"]' },
    { name: 'public-guestbook-375.png', screen: 'public-guestbook', viewport: 'mobile375', selector: '[data-testid="ref-guestbook"]' },
    { name: 'public-gallery-375.png', screen: 'public-gallery', viewport: 'mobile375', selector: '[data-testid="ref-gallery"]' },
    { name: 'public-map-375.png', screen: 'public-map', viewport: 'mobile375', selector: '[data-testid="ref-map"]' },
    { name: 'public-share-375.png', screen: 'public-share', viewport: 'mobile375', selector: '[data-testid="ref-share"]' },
    { name: 'editor-desktop-basic-1440.png', screen: 'editor-desktop-basic', viewport: 'desktop1440', selector: '[data-testid="ref-editor-desktop"]' },
    { name: 'editor-mobile-basic-375.png', screen: 'editor-mobile-basic', viewport: 'mobile375', selector: '[data-testid="ref-editor-mobile"]' },
  ];

  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: VIEWPORTS[shot.viewport],
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(`${fileUrl}?screen=${shot.screen}`, { waitUntil: 'domcontentloaded' });
    await waitFonts(page);
    await page.waitForFunction(() => document.documentElement.dataset.fontsReady === '1', null, {
      timeout: 10_000,
    }).catch(() => undefined);
    if (shot.selector) {
      await capture(page, path.join(REF_DIR, shot.name), page.locator(shot.selector).first());
    } else {
      await capture(page, path.join(REF_DIR, shot.name));
    }
    await context.close();
  }
  return shots.length;
}

test.describe('Figma layout pixel QA', () => {
  test('layout-mode capture + masked diff', async ({ browser }) => {
    for (const dir of [REF_DIR, ACT_DIR, REPORTS_DIR]) fs.mkdirSync(dir, { recursive: true });

    const deploy = await identifyDeploy();
    const refCount = await captureFigmaReference(browser);

    const setup = await browser.newPage({ viewport: VIEWPORTS.mobile375, deviceScaleFactor: 1 });
    setup.setDefaultNavigationTimeout(90_000);
    await setup.goto(FE, { waitUntil: 'domcontentloaded' });
    const fixture = await ensureFixture(setup);
    await setup.close();

    // Public mobile sections (layout mode)
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
      await enableLayoutMode(page);

      const hero = page.locator('section[aria-label="대표 이미지"]').first();
      await expect(hero).toBeVisible({ timeout: 30_000 });
      await capture(page, path.join(ACT_DIR, 'public-hero-375.png'), hero);
      await writeMasks('public-hero-375.png', await masksRelativeTo(hero, [
        { sel: '[class*="heroMedia"], [class*="heroImage"], img', kind: 'hero' },
      ]));

      const couple = page.getByTestId('couple-section');
      await expect(couple).toBeVisible({ timeout: 30_000 });
      await couple.scrollIntoViewIfNeeded();
      await waitFonts(page);
      await capture(page, path.join(ACT_DIR, 'public-couple-375.png'), couple);
      await writeMasks('public-couple-375.png', await masksRelativeTo(couple, [
        { sel: '[class*="couplePhotoFrame"]', kind: 'couple' },
      ]));

      const guestbook = page.getByTestId('guestbook-section');
      await expect(guestbook).toBeVisible({ timeout: 30_000 });
      await guestbook.scrollIntoViewIfNeeded();
      await waitFonts(page);
      await capture(page, path.join(ACT_DIR, 'public-guestbook-375.png'), guestbook);
      await writeMasks('public-guestbook-375.png', []);

      const gallery = page.locator('[aria-label="Album"]').first();
      await expect(gallery).toBeVisible({ timeout: 30_000 });
      await gallery.scrollIntoViewIfNeeded();
      await waitFonts(page);
      await capture(page, path.join(ACT_DIR, 'public-gallery-375.png'), gallery);
      await writeMasks('public-gallery-375.png', await masksRelativeTo(gallery, [
        { sel: '[class*="galleryCarousel"], [class*="galleryMainImage"], img', kind: 'gallery' },
      ]));

      const mapTitle = page.locator('text=위치 안내').first();
      await expect(mapTitle).toBeVisible({ timeout: 30_000 });
      const mapSection = page.locator('section').filter({ hasText: '위치 안내' }).first();
      await mapSection.scrollIntoViewIfNeeded();
      await waitFonts(page);
      await capture(page, path.join(ACT_DIR, 'public-map-375.png'), mapSection);
      await writeMasks('public-map-375.png', await masksRelativeTo(mapSection, [
        { sel: '[class*="mapImage"], img[alt*="지도"], img[alt="Map"]', kind: 'map' },
      ]));

      const share = page.getByTestId('invitation-share-block');
      await expect(share).toBeVisible({ timeout: 30_000 });
      await share.scrollIntoViewIfNeeded();
      await waitFonts(page);
      await capture(page, path.join(ACT_DIR, 'public-share-375.png'), share);
      await writeMasks('public-share-375.png', []);

      await loginInBrowser(page, fixture.email);
      await page.goto(`/editor/${fixture.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await enableLayoutMode(page);
      await expect(page.getByTestId('share-panel')).toHaveCount(0);
      await capture(page, path.join(ACT_DIR, 'editor-mobile-basic-375.png'));
      await writeMasks('editor-mobile-basic-375.png', []);
      await context.close();
    }

    // Desktop editor + public
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
      await enableLayoutMode(page);
      await expect(page.getByTestId('share-panel')).toHaveCount(0);
      await capture(page, path.join(ACT_DIR, 'editor-desktop-basic-1440.png'));
      await writeMasks('editor-desktop-basic-1440.png', []);

      await page.goto(`/i/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await enableLayoutMode(page);
      await capture(page, path.join(ACT_DIR, 'public-desktop-1440.png'));
      await writeMasks('public-desktop-1440.png', []);
      await context.close();
    }

    const reportRaw = sh('node scripts/figma-pixel-qa/pixel-diff.mjs');
    const diffSummary = JSON.parse(reportRaw);
    const report = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'diff-report.json'), 'utf8'));

    fs.writeFileSync(
      path.join(REPORTS_DIR, 'baseline.json'),
      JSON.stringify(
        {
          mode: 'layout-masked',
          sameData: true,
          sameFontStack: FIXTURE.fontStack,
          layoutColors: LAYOUT_COLORS,
          ...deploy,
          fixture: { id: fixture.id, shareSlug: fixture.shareSlug },
          referenceCount: refCount,
          actualFiles: fs.readdirSync(ACT_DIR).filter((f) => f.endsWith('.png')),
          referenceFiles: fs.readdirSync(REF_DIR).filter((f) => f.endsWith('.png')),
          diffSummary,
          report,
        },
        null,
        2
      ),
      'utf8'
    );

    expect(refCount).toBeGreaterThan(0);
    expect(report.comparedCount).toBeGreaterThan(0);

    // Primary screens must not be MISSING
    for (const required of [
      'public-hero-375.png',
      'public-couple-375.png',
      'public-guestbook-375.png',
      'public-gallery-375.png',
      'public-map-375.png',
      'public-share-375.png',
    ]) {
      const row = report.results.find((r: { name: string }) => r.name === required);
      expect(row, required).toBeTruthy();
      expect(row.status, `${required} missing`).not.toBe('MISSING');
    }
  });
});
