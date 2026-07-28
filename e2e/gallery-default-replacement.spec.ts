/**
 * Gallery default replacement — development FE smoke.
 * Unit contracts live in frontend/src/invitation/galleryAsset.test.ts
 * and frontend/scripts/check-general-account-gallery.ts
 */
import { test, expect } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.describe('gallery default replacement smoke', () => {
  test('concept page loads without pageerror', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${FE}/create/concept`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(400);
    await expect(page.locator('body')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
