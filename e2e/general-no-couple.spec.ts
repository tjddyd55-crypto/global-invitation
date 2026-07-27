/**
 * GENERAL must not render wedding-only couple chrome.
 */
import { test, expect } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.describe('GENERAL presentation', () => {
  test('concept create page has no wedding couple chrome on auth gate', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${FE}/create/concept`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(500);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('THE COUPLE');
    expect(body).not.toContain('The Couple');
  });
});
