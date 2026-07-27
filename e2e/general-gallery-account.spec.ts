/**
 * GENERAL gallery carousel + account labels on development Frontend.
 */
import { test, expect } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.describe('GENERAL gallery/account presentation smoke', () => {
  test('create concept page has no wedding gift-account chrome', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${FE}/create/concept`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(400);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('축의금');
    expect(body).not.toContain('THE COUPLE');
  });
});
