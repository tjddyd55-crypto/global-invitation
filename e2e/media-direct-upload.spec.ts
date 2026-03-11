import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const EDITOR_URL = 'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';
const TEST_IMAGE_PATH =
  'C:/Users/tjddy/.cursor/projects/d-workspace-global-invitation/assets/c__Users_tjddy_AppData_Roaming_Cursor_User_workspaceStorage_650309767ffeb210ade59192394822cf_images_image-d41d32f3-e403-40e4-93d4-e14c4734110d.png';

async function ensureTestLogin(page: Page) {
  const response = await page.request.post('http://localhost:3001/api/test-login', {
    data: { email: 'test@example.com' },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe('R2 Direct Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureTestLogin(page);
  });

  test('hero 업로드 시 presign/complete 경유 및 썸네일 키 생성', async ({ request }) => {
    const presignResponse = await request.post('http://127.0.0.1:3001/api/media/presign', {
      data: {
        folder: 'users/self',
        contentType: 'image/png',
      },
    });
    expect(presignResponse.ok()).toBeTruthy();
    const presignPayload = (await presignResponse.json()) as { uploadUrl: string; fileKey: string };
    expect(presignPayload.uploadUrl).toContain('cloudflarestorage.com');
    expect(presignPayload.fileKey).toContain('.upload');

    const directPutResponse = await putSmallPng(request, presignPayload.uploadUrl);
    expect(directPutResponse.ok()).toBeTruthy();

    const completeResponse = await request.post('http://127.0.0.1:3001/api/media/complete', {
      data: {
        fileKey: presignPayload.fileKey,
      },
    });
    expect(completeResponse.ok()).toBeTruthy();
    const completePayload = (await completeResponse.json()) as {
      fileKey: string;
      thumbnailKey?: string;
      url: string;
      thumbnailUrl?: string;
    };
    expect(completePayload.fileKey).toContain('.webp');
    expect(completePayload.thumbnailKey || '').toContain('thumb_');
    expect(completePayload.url).toContain('.webp');
    expect(completePayload.thumbnailUrl || '').toContain('.webp');
  });

  test('gallery 멀티 업로드 시 큐/진행률 및 다중 presign 호출', async ({ page }) => {
    let presignCalls = 0;

    page.on('response', async (response) => {
      if (response.url().includes('/api/media/presign') && response.status() === 200) {
        presignCalls += 1;
      }
    });

    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const gallerySection = page.locator('[data-section-key="gallery"]');
    await gallerySection.scrollIntoViewIfNeeded();

    const fileInput = gallerySection.locator('input[type="file"][multiple]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles([TEST_IMAGE_PATH, TEST_IMAGE_PATH, TEST_IMAGE_PATH]);

    const queueItems = page.locator('[data-testid="upload-queue-item"]');
    await expect(queueItems).toHaveCount(3, { timeout: 10000 });
    await expect(page.locator('[data-testid="upload-progress-bar"]').first()).toHaveCount(1);

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
    expect(presignCalls).toBeGreaterThan(0);
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
