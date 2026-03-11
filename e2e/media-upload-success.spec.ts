import crypto from 'crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';

const EDITOR_URL =
  'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';
const SMALL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8C2dQAAAAASUVORK5CYII=',
  'base64'
);

test.describe('미디어 업로드 성공', () => {
  test('presign -> direct upload -> complete 후 큐가 done 상태가 되어야 함', async ({ page }) => {
    const presignResponse = await page.request.post('http://localhost:3001/api/media/presign', {
      data: {
        folder: 'e2e/users/self',
        contentType: 'image/png',
      },
    });
    expect(presignResponse.ok()).toBeTruthy();
    const presignPayload = (await presignResponse.json()) as { uploadUrl: string; fileKey: string };
    expect(presignPayload.uploadUrl).toContain('cloudflarestorage.com');
    expect(presignPayload.fileKey).toContain('.upload');

    const directPutResponse = await putSmallPng(page.request, presignPayload.uploadUrl);
    expect(directPutResponse.ok()).toBeTruthy();

    const completeResponse = await page.request.post('http://localhost:3001/api/media/complete', {
      data: { fileKey: presignPayload.fileKey },
    });
    expect(completeResponse.ok()).toBeTruthy();

    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');

    const uploadInput = page.getByTestId('gallery-upload-input');
    await expect(uploadInput).toBeAttached();
    await uploadInput.setInputFiles({
      name: buildRandomFileName('png'),
      mimeType: 'image/png',
      buffer: SMALL_PNG,
    });

    const queueItems = page.getByTestId('upload-queue-item');
    await expect(queueItems).toHaveCount(1, { timeout: 10000 });

    await expect
      .poll(async () => queueItems.first().getAttribute('data-upload-status'), { timeout: 45000 })
      .toBe('done');

    await expect(page.getByTestId('editor-save-button')).toBeEnabled();
  });
});

async function putSmallPng(request: APIRequestContext, uploadUrl: string) {
  const smallPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8C2dQAAAAASUVORK5CYII=',
    'base64'
  );
  return request.fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/png',
    },
    data: smallPng,
  });
}

function buildRandomFileName(extension: string): string {
  return `e2e-${Date.now()}-${crypto.randomUUID()}.${extension}`;
}
