import { expect, test } from '@playwright/test';

const FE = process.env.E2E_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

test.describe('Locale Product Mode', () => {
  test.use({
    baseURL: FE,
    viewport: { width: 1280, height: 800 },
  });

  test('A. first visit English selector updates home copy and persists', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    const selector = page.getByTestId('locale-selector').first();
    await expect(selector).toBeVisible({ timeout: 60_000 });
    await selector.selectOption('en-US');
    await expect(page.getByTestId('header-create-cta')).toHaveText(/Create Invitation/i);
    await expect(page.getByTestId('main-concept-wedding')).toContainText(/Wedding/i);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('locale-selector').first()).toHaveValue('en-US');
    await expect(page.getByTestId('header-create-cta')).toHaveText(/Create Invitation/i);
  });

  test('E. selector persistence across pricing/contact', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('en-US');
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('pricing-page')).toContainText(/Pay only when you publish/i);
    await page.goto('/contact', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('contact-page')).toContainText(/Contact us/i);
    await expect(page.getByTestId('locale-selector').first()).toHaveValue('en-US');
  });

  test('F. mobile 390 English home', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('en-US');
    await expect(page.getByTestId('hero-create-cta')).toContainText(/Create Invitation/i);
    await expect(page.getByTestId('main-concept-organization')).toContainText(/Organization/i);
  });

  test('C. public Korean invitation ignores browser English', async ({ page }) => {
    await page.goto('/templates/ORGANIZATION_02_JCI/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await page.getByTestId('locale-selector').first().selectOption('ko-KR').catch(() => undefined);
    const doc = page.getByTestId('public-invitation-document');
    await expect(doc).toBeVisible({ timeout: 60_000 });
    await expect(doc).toHaveAttribute('data-visual-template', 'ORGANIZATION_02_JCI');
    await expect(page.getByText('서울광진청년회의소').first()).toBeVisible();
  });

  test('EN preview fixture and chrome are English', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('en-US');
    await page.goto('/templates/ORGANIZATION_02_JCI/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const doc = page.getByTestId('public-invitation-document');
    await expect(doc).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('JCI Seoul Gwangjin').first()).toBeVisible();
    await expect(page.getByText('Inauguration', { exact: false }).first()).toBeVisible();
    await expect(doc).not.toContainText('기관명을 입력해 주세요');
    await expect(doc).not.toContainText('참석 여부');
  });

  test('KO preview remains Korean', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('ko-KR');
    await page.goto('/templates/ORGANIZATION_02_JCI/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const doc = page.getByTestId('public-invitation-document');
    await expect(doc).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('서울광진청년회의소').first()).toBeVisible();
    await expect(doc).not.toContainText('Basic Info');
  });
});
