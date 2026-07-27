/**
 * Google-only maps / directions regression (public invitation location chrome).
 */
import { test, expect } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

const FORBIDDEN_NAV = ['네이버', '카카오내비', '티맵', 'Naver Map', 'Kakao Navi', 'T Map'];

test.describe('Google-only maps policy', () => {
  test('home still has no KR map vendors in chrome', async ({ page }) => {
    await page.goto(FE + '/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(500);
    const body = await page.locator('body').innerText();
    for (const needle of FORBIDDEN_NAV) {
      expect(body, needle).not.toContain(needle);
    }
  });
});
