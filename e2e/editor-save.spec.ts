import { expect, test } from '@playwright/test';

const EDITOR_URL =
  'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';

test.describe('에디터 저장', () => {
  test('텍스트 수정 후 저장 상태 전환이 정상이어야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');

    const titleInput = page.getByTestId('basic-title-input');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(`E2E 저장 테스트 ${Date.now()}`);

    const saveButton = page.getByTestId('editor-save-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(saveButton).toHaveAttribute('data-saving', 'true');
    await expect(saveButton).toHaveAttribute('data-saving', 'false', { timeout: 15000 });
    await expect(saveButton).toBeEnabled();
  });
});
