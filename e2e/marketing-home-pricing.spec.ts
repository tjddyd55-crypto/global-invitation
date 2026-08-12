/**
 * Marketing shell — single canonical header + home category parity (development).
 */
import { expect, test, type Page } from '@playwright/test';

const FE = process.env.E2E_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
  expect(overflow).toBeFalsy();
}

async function assertSingleMarketingHeader(page: Page, viewport: 'desktop' | 'mobile') {
  await expect(page.getByTestId('marketing-site-header')).toHaveCount(1);
  await expect(page.getByTestId('global-header')).toHaveCount(0);
  await expect(page.getByText('템플릿 검색')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '이메일로 시작하기' })).toHaveCount(0);

  if (viewport === 'desktop') {
    await expect(page.getByTestId('marketing-desktop-header')).toBeVisible();
    await expect(page.getByTestId('marketing-mobile-header')).toHaveCount(0);
    await expect(page.getByRole('link', { name: '요금 안내' })).toBeVisible();
    await expect(page.getByRole('link', { name: '고객센터' })).toBeVisible();
  } else {
    await expect(page.getByTestId('marketing-mobile-header')).toBeVisible();
    await expect(page.getByTestId('marketing-desktop-header')).toHaveCount(0);
  }
}

test.describe('marketing header and home categories', () => {
  test('pricing/contact desktop has exactly one Invite header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${FE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('pricing-page')).toBeVisible({ timeout: 60_000 });
    await assertSingleMarketingHeader(page, 'desktop');
    await expect(page.getByRole('heading', { name: '필요한 만큼만 결제하세요' })).toBeVisible();
    await expect(page.getByText('$30')).toBeVisible();
    await expect(page.getByText('$10')).toBeVisible();

    await page.goto(`${FE}/contact`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('contact-page')).toBeVisible({ timeout: 60_000 });
    await assertSingleMarketingHeader(page, 'desktop');
    await expect(page.getByTestId('contact-email')).toBeVisible();
  });

  test('pricing/contact mobile has exactly one Invite header', async ({ page }) => {
    for (const width of [390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${FE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('pricing-page')).toBeVisible({ timeout: 60_000 });
      await assertSingleMarketingHeader(page, 'mobile');
      await assertNoHorizontalOverflow(page);

      await page.goto(`${FE}/contact`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('contact-page')).toBeVisible({ timeout: 60_000 });
      await assertSingleMarketingHeader(page, 'mobile');
      await assertNoHorizontalOverflow(page);
    }
  });

  test('home shows four concepts and organization links to template catalog', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('main-concept-cards')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('global-header')).toHaveCount(0);
    await expect(page.getByTestId('marketing-desktop-header')).toHaveCount(1);
    await expect(page.getByTestId('home-invitation-preview')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('public-invitation-document')).toHaveAttribute(
      'data-visual-template',
      'WEDDING_05_GARDEN'
    );
    await expect(page.getByTestId('hero-create-cta')).toBeVisible();
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

  test('home invitation preview stays clipped on mobile', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('home-invitation-preview')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('hero-create-cta')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    }
  });
});
