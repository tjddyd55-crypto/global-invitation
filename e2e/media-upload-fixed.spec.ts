import { expect, test, type Page } from '@playwright/test';

const EDITOR_URL = 'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';
const TEST_IMAGE_PATH =
  'C:/Users/tjddy/.cursor/projects/d-workspace-global-invitation/assets/c__Users_tjddy_AppData_Roaming_Cursor_User_workspaceStorage_650309767ffeb210ade59192394822cf_images_image-d41d32f3-e403-40e4-93d4-e14c4734110d.png';

async function ensureTestLogin(page: Page) {
  const response = await page.request.post('http://localhost:3001/api/test-login', {
    data: { email: 'test@example.com' },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe('미디어 업로드 UI QA (수정)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureTestLogin(page);
  });

  test('1. Hero 업로드 요청에서 AUTH_REQUIRED가 발생하지 않아야 함', async ({ page }) => {
    let mediaCallCount = 0;
    const failures: Array<{ status: number; errorCode: string | null }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/media/presign') || url.includes('/api/media/complete') || url.includes('/api/media/upload')) {
        mediaCallCount += 1;
        const status = response.status();
        if (status >= 400) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          failures.push({ status, errorCode: payload?.error || null });
        }
      }
    });

    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const heroSection = page.locator('[data-section-key="hero"]');
    const fileInput = heroSection.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    await expect
      .poll(() => mediaCallCount, { timeout: 20000 })
      .toBeGreaterThan(0);

    const authRequiredFailures = failures.filter((item) => item.status === 401 && item.errorCode === 'AUTH_REQUIRED');
    expect(authRequiredFailures).toHaveLength(0);

    const previewSrc = await heroSection.locator('img[alt*="preview"]').first().getAttribute('src');
    expect(previewSrc || '').not.toBe('');
  });

  test('2. Gallery 업로드 큐가 완료되고 최소 1건 이상 성공해야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const gallerySection = page.locator('[data-section-key="gallery"]');
    await gallerySection.scrollIntoViewIfNeeded();

    const fileInput = gallerySection.locator('input[type="file"][multiple]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles([TEST_IMAGE_PATH, TEST_IMAGE_PATH]);

    const queueItems = page.locator('[data-testid="upload-queue-item"]');
    await expect(queueItems).toHaveCount(2, { timeout: 10000 });

    await expect
      .poll(
        async () =>
          queueItems.evaluateAll((elements) =>
            elements.filter((element) => ['done', 'error'].includes(element.getAttribute('data-upload-status') || '')).length
          ),
        { timeout: 45000 }
      )
      .toBe(2);

    const doneCount = await queueItems.evaluateAll(
      (elements) => elements.filter((element) => element.getAttribute('data-upload-status') === 'done').length
    );
    expect(doneCount).toBeGreaterThan(0);
  });

  test('3. 업로드 이후 저장 버튼이 정상 동작해야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const heroSection = page.locator('[data-section-key="hero"]');
    const fileInput = heroSection.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    const saveButton = page.locator('button:has-text("저장")').first();
    await expect(saveButton).toBeEnabled({ timeout: 10000 });
    await saveButton.click();

    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find((btn) => btn.textContent?.includes('저장'));
      return saveBtn && !saveBtn.disabled && !saveBtn.textContent?.includes('저장 중');
    }, { timeout: 15000 });

    await expect(saveButton).toBeEnabled();
  });
});
