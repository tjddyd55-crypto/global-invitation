/**
 * Editorial GRID_EXPAND fixed-slot collage — Template Preview markers.
 *
 *   npx playwright test e2e/visual-template-editorial-gallery-slots.spec.ts --project=chromium
 */
import { expect, test, type Page } from '@playwright/test';
import { FE } from './helpers/visualTemplateAcceptance';

async function assertEditorialFixedSlots(page: Page, viewport: { width: number; height: number }) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.setViewportSize(viewport);
  await page.goto(`${FE}/templates/WEDDING_04_EDITORIAL/preview`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });

  const gallery = page.getByTestId('public-gallery').first();
  await expect(gallery).toBeVisible({ timeout: 60_000 });
  await expect(gallery).toHaveAttribute('data-gallery-presentation', 'editorial');
  await expect(gallery).toHaveAttribute('data-gallery-layout', 'GRID_EXPAND');

  const grid = gallery.getByTestId('gallery-grid');
  await expect(grid).toHaveAttribute('data-editorial-grid', 'fixed-slots');

  const first = grid.locator('[data-editorial-slot]').first();
  await expect(first).toHaveAttribute('data-editorial-slot', 'WIDE');

  const slots = grid.locator('[data-editorial-slot]');
  const count = await slots.count();
  expect(count).toBeGreaterThanOrEqual(3);

  // Paired row equal height (index 1 and 2 when present)
  if (count >= 3) {
    const left = slots.nth(1);
    const right = slots.nth(2);
    await expect(left).toHaveAttribute('data-editorial-slot', 'PORTRAIT_LEFT');
    await expect(right).toHaveAttribute('data-editorial-slot', 'PORTRAIT_RIGHT');
    const boxL = await left.boundingBox();
    const boxR = await right.boundingBox();
    expect(boxL && boxR).toBeTruthy();
    if (boxL && boxR) {
      expect(Math.abs(boxL.height - boxR.height)).toBeLessThan(2);
      expect(Math.abs(boxL.y - boxR.y)).toBeLessThan(2);
    }
  }

  // First wide slot wider than a half column
  const wideBox = await first.boundingBox();
  const galleryBox = await gallery.boundingBox();
  expect(wideBox && galleryBox).toBeTruthy();
  if (wideBox && galleryBox) {
    expect(wideBox.width).toBeGreaterThan(galleryBox.width * 0.7);
  }

  // No horizontal overflow
  const overflowX = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflowX).toBeLessThanOrEqual(1);

  expect(errors, errors.join('\n')).toEqual([]);
}

test.describe('Editorial GRID_EXPAND fixed slots', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
  ]) {
    test(`preview ${viewport.width}px`, async ({ page }) => {
      await assertEditorialFixedSlots(page, viewport);
    });
  }
});
