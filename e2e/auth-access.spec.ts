import { expect, test } from '@playwright/test';

const EDITOR_URL =
  'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';

test.describe('로그인 상태 접근', () => {
  test('저장된 세션으로 에디터 접근이 가능해야 함', async ({ page }) => {
    const authFailures: Array<{ url: string; error: string | null }> = [];

    page.on('response', async (response) => {
      if (!response.url().includes('/api/')) return;
      if (response.status() !== 401) return;
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      authFailures.push({ url: response.url(), error: payload?.error || null });
    });

    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('wedding-editor-root')).toBeVisible();
    await expect(page.getByTestId('editor-save-button')).toBeVisible();

    const authRequiredFailures = authFailures.filter((failure) => failure.error === 'AUTH_REQUIRED');
    expect(authRequiredFailures).toHaveLength(0);
  });
});
