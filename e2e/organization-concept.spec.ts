/**
 * ORGANIZATION concept — selection + catalog smoke (development).
 */
import { expect, test } from '@playwright/test';

const FE = process.env.E2E_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const BE = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.describe('ORGANIZATION concept flow', () => {
  test.use({
    baseURL: FE,
    viewport: { width: 390, height: 844 },
  });

  test('public template preview renders ORGANIZATION_01_OFFICIAL', async ({ page }) => {
    await page.goto('/templates/ORGANIZATION_01_OFFICIAL/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const doc = page.getByTestId('public-invitation-document');
    await expect(doc).toBeVisible({ timeout: 60_000 });
    await expect(doc).toHaveAttribute('data-visual-template', 'ORGANIZATION_01_OFFICIAL');
    await expect(doc).toHaveAttribute('data-concept', 'ORGANIZATION');
    await expect(page.getByText('2026 회장단 이·취임식').first()).toBeVisible();
    await expect(page.getByText('부산청년리더협회').first()).toBeVisible();
  });

  test('create API accepts ORGANIZATION concept', async ({ request }) => {
    const login = await request.post(`${BE}/api/test-login`, {
      data: { email: 'org-e2e@example.com' },
    });
    expect(login.ok()).toBeTruthy();

    const create = await request.post(`${BE}/api/invitations`, {
      data: {
        templateKey: 'invitation_full',
        conceptType: 'ORGANIZATION',
        visualTemplateId: 'ORGANIZATION_01_OFFICIAL',
      },
    });
    expect(create.ok()).toBeTruthy();
    const body = await create.json();
    expect(body?.id || body?.invitation?.id).toBeTruthy();
  });
});
