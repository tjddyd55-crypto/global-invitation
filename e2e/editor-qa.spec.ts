import { test, expect, type Page } from '@playwright/test';

const EDITOR_URL = 'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';
const TEST_IMAGE_PATH = 'C:/Users/tjddy/.cursor/projects/d-workspace-global-invitation/assets/c__Users_tjddy_AppData_Roaming_Cursor_User_workspaceStorage_650309767ffeb210ade59192394822cf_images_image-d41d32f3-e403-40e4-93d4-e14c4734110d.png';

async function ensureTestLogin(page: Page) {
  const response = await page.request.post('http://localhost:3001/api/test-login', {
    data: { email: 'test@example.com' },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe('초대장 에디터 상호작용 QA', () => {
  test.beforeEach(async ({ page }) => {
    await ensureTestLogin(page);
  });

  test('A. Hero 이미지 업로드 동작 (업로드 후 프리뷰 반영)', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const heroSection = page.locator('[data-section-key="hero"]');
    await expect(heroSection).toBeVisible();

    const fileInput = heroSection.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    await page.waitForTimeout(3000);

    const uploadedPreview = heroSection.locator('img[alt*="preview"]');
    await expect(uploadedPreview).toBeVisible({ timeout: 10000 });

    const previewSrc = await uploadedPreview.getAttribute('src');
    expect(previewSrc).toBeTruthy();
    expect(previewSrc).not.toBe('');

    const livePreview = page.locator('.previewColumn img, aside img').first();
    if (await livePreview.isVisible()) {
      const livePreviewSrc = await livePreview.getAttribute('src');
      expect(livePreviewSrc).toBeTruthy();
    }
  });

  test('B. Gallery 다중 업로드/재정렬/삭제/프리뷰 반영', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const gallerySection = page.locator('[data-section-key="gallery"]');
    await gallerySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const fileInput = gallerySection.locator('input[type="file"][multiple]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles([TEST_IMAGE_PATH, TEST_IMAGE_PATH]);

    await expect(gallerySection.locator('label:has-text("업로드 중...")')).toHaveCount(0, { timeout: 20000 });
    await page.waitForTimeout(1000);

    const galleryItems = gallerySection.locator('li');
    const itemCount = await galleryItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(2);

    if (itemCount >= 2) {
      const firstListItem = galleryItems.nth(0);
      const firstItemImage = firstListItem.locator('img');
      const firstSrc = await firstItemImage.getAttribute('src');
      const moveDownButton = firstListItem.locator('button:has-text("아래로")');
      await moveDownButton.click();
      await page.waitForTimeout(1000);

      const newFirstItemImage = galleryItems.nth(0).locator('img');
      const newFirstSrc = await newFirstItemImage.getAttribute('src');
      expect(newFirstSrc).not.toBe(firstSrc);

      const uploadedItem = gallerySection.locator('li:has(img[src*="r2.dev"])').first();
      await expect(uploadedItem).toBeVisible();
      const targetImage = uploadedItem.locator('img').first();
      const targetSrc = await targetImage.getAttribute('src');
      const targetCountBeforeDelete = targetSrc ? await gallerySection.locator(`img[src="${targetSrc}"]`).count() : 0;
      const deleteButton = uploadedItem.locator('button:has-text("삭제")');
      await expect(deleteButton).toBeEnabled();
      await deleteButton.click();

      if (targetSrc && targetCountBeforeDelete > 0) {
        await expect
          .poll(async () => gallerySection.locator(`img[src="${targetSrc}"]`).count(), {
            timeout: 10000,
          })
          .toBeLessThan(targetCountBeforeDelete);
      }

      await expect
        .poll(async () => galleryItems.count(), {
          timeout: 10000,
        })
        .toBeLessThan(itemCount);
    }
  });

  test('C. 텍스트 입력 시 라이브 프리뷰 즉시 반영', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const basicSection = page.locator('[data-section-key="basic"]');
    await expect(basicSection).toBeVisible();

    const titleInput = basicSection.locator('input[placeholder*="유동규"]');
    await titleInput.fill('QA 테스트 제목');
    await page.waitForTimeout(500);

    const previewColumn = page.locator('aside.previewColumn, aside:has-text("라이브 미리보기")').last();
    const previewText = await previewColumn.textContent();
    expect(previewText).toContain('QA 테스트 제목');

    const venueInput = basicSection.locator('input[placeholder*="더링크호텔"]');
    await venueInput.fill('QA 테스트 장소');
    await page.waitForTimeout(500);

    const finalPreviewText = await previewColumn.textContent();
    expect(finalPreviewText).toContain('QA 테스트 장소');

    const messageSection = basicSection.locator('textarea[placeholder*="문단을"]');
    await messageSection.fill('QA 테스트 메시지입니다.\n두 번째 문단입니다.');
    await page.waitForTimeout(500);

    const messagePreviewText = await previewColumn.textContent();
    expect(messagePreviewText).toContain('QA 테스트 메시지입니다');
  });

  test('D. 스크롤 기반 섹션 네비게이션 (클릭 이동/스크롤 스파이)', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const navButton = page.locator('button:has-text("Gallery")').first();
    await navButton.click();
    await page.waitForTimeout(1500);

    const gallerySection = page.locator('[data-section-key="gallery"]');
    await expect(gallerySection).toBeInViewport();

    await page.waitForTimeout(1000);

    const heroNavButton = page.locator('button:has-text("Hero")').first();
    await heroNavButton.click();
    await page.waitForTimeout(1500);

    const heroSection = page.locator('[data-section-key="hero"]');
    await expect(heroSection).toBeInViewport();
  });

  test('E. 풀스크린 프리뷰 열기/닫기 및 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const previewButton = page.locator('button:has-text("Preview")');
    await expect(previewButton).toBeVisible({ timeout: 10000 });
    await previewButton.click();
    await page.waitForTimeout(1000);

    const fullscreenOverlay = page.locator('[class*="fullscreenPreview"]');
    await expect(fullscreenOverlay.first()).toBeVisible();

    const closeButton = page.locator('button[aria-label*="닫기"], button:has-text("←")').first();
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await page.waitForTimeout(500);

    await expect(fullscreenOverlay.first()).not.toBeVisible();
  });

  test('F. 저장 후 새로고침 시 상태 복원', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const basicSection = page.locator('[data-section-key="basic"]');
    const titleInput = basicSection.locator('input[placeholder*="유동규"]');
    const uniqueTitle = `QA 테스트 ${Date.now()}`;
    await titleInput.fill(uniqueTitle);
    await page.waitForTimeout(500);

    const saveButton = page.locator('button:has-text("저장")').first();
    await saveButton.click();
    
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent?.includes('저장'));
      return saveBtn && !saveBtn.disabled && !saveBtn.textContent?.includes('저장 중');
    }, { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const restoredTitleInput = page.locator('[data-section-key="basic"] input[placeholder*="유동규"]');
    const restoredValue = await restoredTitleInput.inputValue();
    expect(restoredValue).toBe(uniqueTitle);
  });

  test('통합: 전체 플로우 검증', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const basicSection = page.locator('[data-section-key="basic"]');
    await basicSection.locator('input[placeholder*="유동규"]').fill('통합 테스트 제목');
    await page.waitForTimeout(300);

    const heroSection = page.locator('[data-section-key="hero"]');
    await heroSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const heroFileInput = heroSection.locator('input[type="file"]');
    await heroFileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(3000);

    const gallerySection = page.locator('[data-section-key="gallery"]');
    await gallerySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const galleryFileInput = gallerySection.locator('input[type="file"][multiple]');
    await galleryFileInput.setInputFiles([TEST_IMAGE_PATH]);
    await page.waitForTimeout(3000);

    const saveButton = page.locator('button:has-text("저장")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);

    const buttonText = await saveButton.textContent();
    expect(buttonText).toContain('저장');
    expect(buttonText).not.toContain('저장 중');
  });
});
