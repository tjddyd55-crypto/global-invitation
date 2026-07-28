/**
 * Public invitation mobile full-bleed geometry.
 * Asserts document / hero / gallery / map match viewport width (no side gutters).
 */
import { test, expect, type Page, type Browser, type Route } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const WEDDING_SLUG = process.env.PUBLIC_WEDDING_SLUG || process.env.DESIGN_QA_SHARE_SLUG || 'tpiqfk0tt';
const GENERAL_SLUG = process.env.PUBLIC_GENERAL_SLUG || '';
const FUNERAL_SLUG = process.env.PUBLIC_FUNERAL_SLUG || '';
const EDITOR_ID = process.env.DESIGN_QA_EDITOR_ID || '';

const ARTIFACT_DIR = path.join(process.cwd(), 'artifacts', 'public-full-bleed');

async function freshPage(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  return { context, page, pageErrors, consoleErrors };
}

async function mockShareInvitation(page: Page, payload: Record<string, unknown>) {
  await page.route('**/api/invitations/share/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

async function waitPublicReady(page: Page) {
  await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 45_000 });
}

async function measureFullBleed(page: Page, expectedWidth: number) {
  const metrics = await page.evaluate((width) => {
    const box = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        width: Math.round(r.width),
        y: Math.round(r.y),
        height: Math.round(r.height),
      };
    };
    return {
      viewport: width,
      scrollWidth: document.documentElement.scrollWidth,
      root: box(document.querySelector('[data-testid="public-route-root"]')),
      document: box(document.querySelector('[data-testid="public-invitation-document"]')),
      hero: box(document.querySelector('[data-testid="public-hero"]')),
      gallery: box(document.querySelector('[data-testid="public-gallery"]')),
      map: box(document.querySelector('[data-testid="public-map"]')),
      column: box(document.querySelector('[data-testid="desktop-invitation-column"]')),
      marketingHeader: document.querySelectorAll('[data-testid="marketing-desktop-header"]').length,
      bottomNav: document.querySelectorAll('[data-testid="mobile-bottom-nav"]').length,
      login: document.querySelectorAll('[data-testid="header-login-button"]').length,
      logout: document.querySelectorAll('[data-testid="header-logout-button"]').length,
    };
  }, expectedWidth);

  expect(metrics.marketingHeader, 'no marketing header').toBe(0);
  expect(metrics.bottomNav, 'no bottom nav').toBe(0);
  expect(metrics.login + metrics.logout, 'no login/logout on public').toBe(0);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(expectedWidth + 1);

  if (expectedWidth < 1024) {
    expect(metrics.document?.x).toBe(0);
    expect(metrics.document?.width).toBe(expectedWidth);
    expect(metrics.hero?.x).toBe(0);
    expect(metrics.hero?.width).toBe(expectedWidth);
    if (metrics.gallery) {
      expect(metrics.gallery.x).toBe(0);
      expect(metrics.gallery.width).toBe(expectedWidth);
    }
    if (metrics.map) {
      expect(metrics.map.x).toBe(0);
      expect(metrics.map.width).toBe(expectedWidth);
    }
  } else {
    expect(metrics.column?.width).toBe(375);
    expect(metrics.document?.width).toBe(375);
    expect(metrics.hero?.width).toBe(375);
    if (metrics.gallery) expect(metrics.gallery.width).toBe(375);
    if (metrics.map) expect(metrics.map.width).toBe(375);
  }

  return metrics;
}

async function capture(page: Page, name: string) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const file = path.join(ARTIFACT_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

const generalPayload = {
  id: 'mock-general',
  slug: 'mock-general',
  shareSlug: 'mock-general',
  title: '일반 행사',
  templateKey: 'invitation_full',
  templateId: null,
  musicKey: null,
  data: {
    templateType: 'FULL',
    conceptType: 'GENERAL',
    title: '일반 행사',
    heroTitle: '일반 행사',
    heroSubtitle: 'Event',
    heroImage: '/images/wedding/classic/hero.jpg',
    content: '행사에 초대합니다.',
    eventDate: '2025-11-15T14:30:00+09:00',
    weddingDateTime: '2025-11-15T14:30:00+09:00',
    venueName: '컨퍼런스홀',
    locationText: '컨퍼런스홀',
    address: '서울 구로구 경인로 610',
    formattedAddress: '서울 구로구 경인로 610',
    galleryImages: ['/images/wedding/classic/gallery_01.jpg'],
    mapImage: '/images/wedding/classic/map.jpg',
    mapLat: 37.5,
    mapLng: 126.9,
    rsvpEnabled: false,
    schedule: [],
    transportInfo: [],
    parkingInfo: [],
    accounts: [],
    messages: [],
  },
  dataJson: null,
};

const funeralPayload = {
  id: 'mock-funeral',
  slug: 'mock-funeral',
  shareSlug: 'mock-funeral',
  title: '부고',
  templateKey: 'funeral_classic',
  templateId: null,
  musicKey: null,
  data: {
    templateKey: 'funeral_classic',
    deceasedName: '홍길동',
    deathDate: '2025-01-01',
    message: '삼가 고인의 명복을 빕니다.',
    chiefMourner: '홍철수',
    familyMembers: ['아들 홍철수'],
    schedule: { funeralDate: '2025-01-03T09:00:00+09:00' },
    funeralHall: {
      name: '서울장례식장',
      address: '서울 구로구 경인로 610',
      mapImage: '/images/wedding/classic/map.jpg',
      mapLat: 37.5,
      mapLng: 126.9,
    },
    heroImage: '/images/wedding/classic/hero.jpg',
    contact: { name: '홍철수', phone: '010-0000-0000' },
  },
};

test.describe('Public invitation full-bleed', () => {
  test.describe.configure({ timeout: 90_000 });

  test('Wedding public 375', async ({ browser }) => {
    const { context, page, pageErrors, consoleErrors } = await freshPage(browser, {
      width: 375,
      height: 812,
    });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitPublicReady(page);
    await page.waitForTimeout(800);
    const metrics = await measureFullBleed(page, 375);
    await capture(page, 'wedding-375.png');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors.filter((e) => !e.includes('favicon'))).toEqual([]);
    expect(metrics.hero?.width).toBe(375);
    await context.close();
  });

  test('Wedding public 390', async ({ browser }) => {
    const { context, page, pageErrors } = await freshPage(browser, { width: 390, height: 844 });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitPublicReady(page);
    await page.waitForTimeout(800);
    const metrics = await measureFullBleed(page, 390);
    await capture(page, 'wedding-390.png');
    expect(pageErrors).toEqual([]);
    expect(metrics.document?.width).toBe(390);
    await context.close();
  });

  test('General public 375', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 375, height: 812 });
    if (GENERAL_SLUG) {
      await page.goto(`${FE}/i/${GENERAL_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    } else {
      await mockShareInvitation(page, generalPayload);
      await page.goto(`${FE}/i/mock-general-fullbleed`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    }
    await waitPublicReady(page);
    await measureFullBleed(page, 375);
    await capture(page, 'general-375.png');
    await context.close();
  });

  test('General public 390', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    if (GENERAL_SLUG) {
      await page.goto(`${FE}/i/${GENERAL_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    } else {
      await mockShareInvitation(page, generalPayload);
      await page.goto(`${FE}/i/mock-general-fullbleed`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    }
    await waitPublicReady(page);
    await measureFullBleed(page, 390);
    await capture(page, 'general-390.png');
    await context.close();
  });

  test('Funeral public mobile', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    if (FUNERAL_SLUG) {
      await page.goto(`${FE}/i/${FUNERAL_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    } else {
      await mockShareInvitation(page, funeralPayload);
      await page.goto(`${FE}/i/mock-funeral-fullbleed`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    }
    await waitPublicReady(page);
    await measureFullBleed(page, 390);
    await capture(page, 'funeral-390.png');
    await context.close();
  });

  test('Desktop public 1440', async ({ browser }) => {
    const { context, page, pageErrors } = await freshPage(browser, { width: 1440, height: 1024 });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitPublicReady(page);
    await page.waitForTimeout(800);
    const metrics = await measureFullBleed(page, 1440);
    await capture(page, 'wedding-desktop-1440.png');
    expect(pageErrors).toEqual([]);
    expect(metrics.column?.width).toBe(375);
    expect(metrics.hero?.width).toBe(375);
    await context.close();
  });

  test('Editor preview internal full-width', async ({ browser }) => {
    test.skip(!EDITOR_ID, 'Set DESIGN_QA_EDITOR_ID');
    const { context, page } = await freshPage(browser, { width: 1440, height: 1024 });
    await page.goto(`${FE}/editor/${EDITOR_ID}?concept=WEDDING`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const viewport = page.getByTestId('editor-live-preview-viewport');
    await expect(viewport).toBeVisible({ timeout: 45_000 });
    const metrics = await page.evaluate(() => {
      const box = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { width: Math.round(r.width) };
      };
      const vp = document.querySelector('[data-testid="editor-live-preview-viewport"]');
      return {
        viewport: box(vp),
        document: box(vp?.querySelector('[data-testid="public-invitation-document"]') || null),
        hero: box(vp?.querySelector('[data-testid="public-hero"]') || null),
        gallery: box(vp?.querySelector('[data-testid="public-gallery"]') || null),
        map: box(vp?.querySelector('[data-testid="public-map"]') || null),
      };
    });
    expect(metrics.viewport?.width).toBeGreaterThan(200);
    expect(metrics.document?.width).toBe(metrics.viewport?.width);
    expect(metrics.hero?.width).toBe(metrics.viewport?.width);
    if (metrics.gallery) expect(metrics.gallery.width).toBe(metrics.viewport?.width);
    if (metrics.map) expect(metrics.map.width).toBe(metrics.viewport?.width);
    await context.close();
  });
});
