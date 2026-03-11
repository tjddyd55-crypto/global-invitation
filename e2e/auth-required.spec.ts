import { expect, test } from '@playwright/test';

const EDITOR_URL = 'http://localhost:3000/editor/qa-e2e-media-20260309';

test.use({
  storageState: { cookies: [], origins: [] },
});

test.describe('비로그인 접근 차단', () => {
  test('세션 없이 보호 API 접근 시 AUTH_REQUIRED를 반환해야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('wedding-editor-root')).toHaveCount(0);

    const response = await page.request.post('http://localhost:3001/api/media/presign', {
      data: {
        folder: 'users/self',
        contentType: 'image/png',
      },
    });

    expect(response.status()).toBe(401);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe('AUTH_REQUIRED');
  });
});
