import { expect, test } from '@playwright/test';

const EDITOR_URL =
  'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';

test.describe('초대장 공개/공유', () => {
  test('공개 후 공유 URL 생성 및 OG 메타가 노출되어야 함', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');

    const titleInput = page.getByTestId('basic-title-input');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(`공개 테스트 ${Date.now()}`);

    const publishButton = page.getByTestId('editor-publish-button');
    await expect(publishButton).toBeEnabled();
    await publishButton.click();

    const sharePanel = page.getByTestId('share-panel');
    await expect(sharePanel).toBeVisible({ timeout: 20000 });

    const shareUrlElement = page.getByTestId('share-url');
    const sharePath = (await shareUrlElement.textContent())?.trim() || '';
    expect(sharePath).toMatch(/^https?:\/\/|^\/i\//);

    const absoluteShareUrl = sharePath.startsWith('http') ? sharePath : `http://localhost:3000${sharePath}`;

    const publicResponse = await page.goto(absoluteShareUrl);
    expect(publicResponse?.ok()).toBeTruthy();

    const htmlResponse = await page.request.get(absoluteShareUrl);
    expect(htmlResponse.ok()).toBeTruthy();
    const html = await htmlResponse.text();
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:image"');
  });
});
