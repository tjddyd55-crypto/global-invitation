/**
 * Music optional + couple enlarge + account compact + RSVP guest count polish.
 */
import { test, expect, type Browser } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const WEDDING_SLUG = process.env.PUBLIC_WEDDING_SLUG || 'tpiqfk0tt';

async function freshPage(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  return { context, page };
}

test.describe('Public invitation polish', () => {
  test.describe.configure({ timeout: 90_000 });

  test('no music player when music not explicitly enabled', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 45_000 });
    await page.waitForTimeout(600);
    expect(await page.getByTestId('invitation-music-player').count()).toBe(0);
    expect(await page.locator('audio').count()).toBe(0);
    await context.close();
  });

  test('music player appears only for enabled music payload', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    await page.route('**/api/invitations/share/**', async (route) => {
      const upstream = await route.fetch();
      const body = await upstream.json();
      const data = body.dataJson || body.data || {};
      body.data = {
        ...data,
        music: {
          enabled: true,
          musicKey: 'piano_soft',
          title: 'Piano Soft',
          loop: false,
          startAtSeconds: 0,
        },
      };
      body.dataJson = body.data;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('invitation-music-player')).toBeVisible({ timeout: 45_000 });
    await page.getByTestId('invitation-music-player').click();
    await expect(page.getByTestId('invitation-music-player')).toHaveAttribute('data-music-status', /playing|loading|error|paused/);
    await context.close();
  });

  test('couple photos larger than legacy 120px on 375', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 375, height: 812 });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('couple-section')).toBeVisible({ timeout: 45_000 });
    const sizes = await page.evaluate(() => {
      const frames = Array.from(document.querySelectorAll('[data-testid="couple-photo"]'));
      return frames.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
    });
    expect(sizes.length).toBeGreaterThanOrEqual(2);
    for (const size of sizes) {
      expect(size.w).toBeGreaterThan(120);
      expect(size.h).toBeGreaterThan(160);
    }
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
    await context.close();
  });

  test('account summary is compact single row', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('invitation-accounts')).toBeVisible({ timeout: 45_000 });
    const summary = page.getByTestId('account-summary').first();
    await expect(summary).toBeVisible();
    const box = await summary.boundingBox();
    expect(box?.height ?? 99).toBeLessThanOrEqual(36);
    await page.getByTestId('account-copy').first().click();
    await expect(page.getByTestId('account-copy-toast')).toBeVisible();
    await context.close();
  });

  test('rsvp guest count can be cleared and set to 4', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    const count = page.getByTestId('rsvp-guest-count');
    await expect(count).toBeVisible({ timeout: 45_000 });
    await expect(count).toHaveValue('1');
    await count.fill('');
    await expect(count).toHaveValue('');
    await count.fill('4');
    await expect(count).toHaveValue('4');

    let posted: unknown = null;
    await page.route('**/api/rsvp', async (route) => {
      if (route.request().method() === 'POST') {
        posted = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            mode: 'created',
            rsvp: {
              id: 'mock-rsvp',
              guestName: '테스트',
              attendance: 'yes',
              guestCount: 4,
              createdAt: new Date().toISOString(),
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.locator('#rsvp-guest-name').fill('테스트');
    await page.getByTestId('rsvp-submit').click();
    await expect.poll(() => posted).not.toBeNull();
    expect((posted as { guestCount: number }).guestCount).toBe(4);
    await context.close();
  });

  test('rsvp empty guest count is blocked', async ({ browser }) => {
    const { context, page } = await freshPage(browser, { width: 390, height: 844 });
    await page.goto(`${FE}/i/${WEDDING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.locator('#rsvp-guest-name').fill('테스트');
    await page.getByTestId('rsvp-guest-count').fill('');
    await page.getByTestId('rsvp-submit').click();
    await expect(page.getByTestId('rsvp-error')).toContainText('참석 인원');
    await context.close();
  });
});
