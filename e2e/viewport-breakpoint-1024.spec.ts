import { test, expect } from '@playwright/test';

/**
 * Figma Make SSOT: width < 1024 → Mobile, width >= 1024 → Desktop.
 * Canonical URL 유지 + hydration-safe shell.
 */

const FE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Viewport breakpoint 1024 SSOT', () => {
  test('1023px renders mobile shell on canonical home', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1023, height: 768 },
      baseURL: FE,
    });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('viewport-shell-fallback')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="pc-shell-editor-main"]')).toHaveCount(0);

    const appErrors = consoleErrors.filter(
      (line) => !/extension|chrome-extension|favicon|React DevTools/i.test(line)
    );
    expect(appErrors, JSON.stringify(appErrors)).toEqual([]);
    await context.close();
  });

  test('1024px renders desktop shell on canonical home', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      baseURL: FE,
    });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('viewport-shell-fallback')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
    await expect(page.getByText('Global Invitation')).toBeVisible({ timeout: 30_000 });

    expect(consoleErrors.filter((l) => /Minified React error #(418|423)/i.test(l))).toEqual([]);
    await context.close();
  });

  test('resize 1023→1024 switches shell without redirect loop', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1023, height: 768 },
      baseURL: FE,
    });
    const page = await context.newPage();

    await page.goto('/templates', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    // auth gate may redirect — stay on templates or auth with next=templates
    await page.waitForTimeout(800);
    const urlBefore = page.url();
    expect(urlBefore.includes('/m/') || urlBefore.includes('/pc/')).toBeFalsy();

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    const urlAfter = page.url();
    expect(urlAfter).toBe(urlBefore);
    await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);

    await context.close();
  });
});
