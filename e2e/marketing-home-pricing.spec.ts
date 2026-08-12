/**
 * Marketing shell + home category parity (development).
 */
import { expect, test } from '@playwright/test';

const FE = process.env.E2E_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.describe('marketing header and home categories', () => {
  test('pricing/contact desktop header matches site chrome', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${FE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('pricing-page')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('marketing-desktop-header')).toBeVisible();
    await expect(page.getByRole('link', { name: '요금 안내' })).toBeVisible();

    await page.goto(`${FE}/contact`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('contact-page')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('marketing-desktop-header')).toBeVisible();
    await expect(page.getByTestId('contact-email')).toBeVisible();
  });

  test('pricing/contact mobile header matches home chrome', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${FE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('marketing-mobile-header')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('marketing-desktop-header')).toHaveCount(0);

    await page.goto(`${FE}/contact`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('marketing-mobile-header')).toBeVisible({ timeout: 60_000 });
  });

  test('home shows four concepts and organization links to template catalog', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('main-concept-cards')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('main-concept-wedding')).toBeVisible();
    await expect(page.getByTestId('main-concept-funeral')).toBeVisible();
    await expect(page.getByTestId('main-concept-general')).toBeVisible();
    const org = page.getByTestId('main-concept-organization');
    await expect(org).toBeVisible();
    await expect(org).toContainText('기업·단체 초대장');
    await expect(page.getByTestId('marketing-desktop-header')).not.toHaveAttribute(
      'data-auth-state',
      'loading',
      { timeout: 30_000 }
    );
    await expect(org).not.toHaveAttribute('href', '#');
    const href = await org.getAttribute('href');
    expect(href || '').toMatch(/concept=ORGANIZATION|concept%3DORGANIZATION/);
  });
});
