import crypto from 'crypto';
import { expect, test } from '@playwright/test';

const EDITOR_URL = 'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';
const TOO_LARGE_IMAGE_BUFFER = Buffer.alloc(11 * 1024 * 1024, 1);
const INVALID_FILE_BUFFER = Buffer.from('not-an-image-content', 'utf8');

test.describe('미디어 업로드 실패 처리', () => {
  test('허용 크기 초과 파일 업로드 시 큐 상태가 error가 되고 저장 버튼은 비활성화되어야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const galleryInput = page.getByTestId('gallery-upload-input');
    await expect(galleryInput).toBeAttached();

    await galleryInput.setInputFiles({
      name: buildRandomFileName('png'),
      mimeType: 'image/png',
      buffer: TOO_LARGE_IMAGE_BUFFER,
    });

    const queueItems = page.getByTestId('upload-queue-item');
    await expect(queueItems).toHaveCount(1, { timeout: 10000 });

    await expect
      .poll(async () => queueItems.first().getAttribute('data-upload-status'), { timeout: 10000 })
      .toBe('error');

    const saveButton = page.getByTestId('editor-save-button');
    await expect(saveButton).toBeDisabled();
  });

  test('지원하지 않는 파일 타입 업로드 시 큐 상태가 error가 되고 저장 버튼은 비활성화되어야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');

    const galleryInput = page.getByTestId('gallery-upload-input');
    await expect(galleryInput).toBeAttached();

    await galleryInput.setInputFiles({
      name: buildRandomFileName('txt'),
      mimeType: 'text/plain',
      buffer: INVALID_FILE_BUFFER,
    });

    const queueItems = page.getByTestId('upload-queue-item');
    await expect(queueItems).toHaveCount(1, { timeout: 10000 });

    await expect
      .poll(async () => queueItems.first().getAttribute('data-upload-status'), { timeout: 10000 })
      .toBe('error');

    const saveButton = page.getByTestId('editor-save-button');
    await expect(saveButton).toBeDisabled();
  });
});

function buildRandomFileName(extension: string): string {
  return `e2e-${Date.now()}-${crypto.randomUUID()}.${extension}`;
}
