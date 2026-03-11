import { expect, test } from '@playwright/test';

test.describe('초대장 생성', () => {
  test('템플릿 선택 후 에디터 페이지로 이동해야 함', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    await page.waitForLoadState('networkidle');

    const templateCreateButtons = page.getByTestId('template-create-button');
    await expect(templateCreateButtons.first()).toBeVisible();

    await templateCreateButtons.first().click();

    await expect(page).toHaveURL(/\/editor\/[^/?]+/);
    await expect(page.getByTestId('wedding-editor-root')).toBeVisible();
  });
});
