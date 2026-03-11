import { expect, test } from '@playwright/test';

const EDITOR_URL = 'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';
const TEST_IMAGE_PATH =
  'C:/Users/tjddy/.cursor/projects/d-workspace-global-invitation/assets/c__Users_tjddy_AppData_Roaming_Cursor_User_workspaceStorage_650309767ffeb210ade59192394822cf_images_image-d41d32f3-e403-40e4-93d4-e14c4734110d.png';

test.describe('미디어 업로드 UI QA', () => {
  test('1. Editor Hero 업로드 후 프리뷰/저장이 가능해야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const heroSection = page.locator('[data-section-key="hero"]');
    await expect(heroSection).toBeVisible();

    const fileInput = page.getByTestId('hero-upload-input');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    const previewImage = heroSection.locator('img[alt*="preview"]').first();
    await expect(previewImage).toBeVisible({ timeout: 10000 });
    const src = await previewImage.getAttribute('src');
    expect(src || '').not.toBe('');

    const saveButton = page.getByTestId('editor-save-button');
    await saveButton.click();
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find((btn) => btn.textContent?.includes('저장'));
      return saveBtn && !saveBtn.disabled && !saveBtn.textContent?.includes('저장 중');
    }, { timeout: 15000 });

    await expect(saveButton).toBeEnabled();
  });

  test('2. Gallery 멀티 업로드 진행률 UI가 표시되고 완료되어야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const fileInput = page.getByTestId('gallery-upload-input');
    await fileInput.setInputFiles([TEST_IMAGE_PATH, TEST_IMAGE_PATH, TEST_IMAGE_PATH]);

    const queueItems = page.locator('[data-testid="upload-queue-item"]');
    await expect(queueItems).toHaveCount(3, { timeout: 10000 });

    const progressBars = page.locator('[data-testid="upload-progress-bar"]');
    await expect(progressBars.first()).toHaveCount(1);

    await expect
      .poll(
        async () =>
          queueItems.evaluateAll((elements) =>
            elements.filter((element) => ['done', 'error'].includes(element.getAttribute('data-upload-status') || '')).length
          ),
        { timeout: 45000 }
      )
      .toBe(3);

    const doneCount = await queueItems.evaluateAll(
      (elements) => elements.filter((element) => element.getAttribute('data-upload-status') === 'done').length
    );
    expect(doneCount).toBeGreaterThan(0);
  });

  test('3. 통합 검증: Hero 업로드 + Gallery 업로드 + 저장 버튼 회복', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const heroFileInput = page.getByTestId('hero-upload-input');
    await heroFileInput.setInputFiles(TEST_IMAGE_PATH);

    const galleryFileInput = page.getByTestId('gallery-upload-input');
    await galleryFileInput.setInputFiles([TEST_IMAGE_PATH]);

    const queueItems = page.locator('[data-testid="upload-queue-item"]');
    await expect(queueItems).toHaveCount(1, { timeout: 10000 });
    await expect
      .poll(
        async () =>
          queueItems.evaluateAll((elements) =>
            elements.filter((element) => ['done', 'error'].includes(element.getAttribute('data-upload-status') || '')).length
          ),
        { timeout: 45000 }
      )
      .toBe(1);

    const saveButton = page.getByTestId('editor-save-button');
    await saveButton.click();

    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find((btn) => btn.textContent?.includes('저장'));
      return saveBtn && !saveBtn.disabled && !saveBtn.textContent?.includes('저장 중');
    }, { timeout: 15000 });

    const saveText = await saveButton.textContent();
    expect(saveText || '').toContain('저장');
    expect(saveText || '').not.toContain('저장 중');
  });
});
