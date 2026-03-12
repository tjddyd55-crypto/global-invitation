import { test, expect } from '@playwright/test';

const LOGIN_URL = 'http://localhost:3000/auth/verify?token=d379c6aafcc99828a2758d0641aec1e0b4df50898e63d9ee05863c7b3d3203c8';
const EDITOR_URL = 'http://localhost:3000/editor/qa-e2e-media-20260309?template=40dec797-cdff-44fb-a5fe-9fe757eb12a4';
const TEST_IMAGE_PATH = 'C:/Users/tjddy/.cursor/projects/d-workspace-global-invitation/assets/c__Users_tjddy_AppData_Roaming_Cursor_User_workspaceStorage_650309767ffeb210ade59192394822cf_images_image-d41d32f3-e403-40e4-93d4-e14c4734110d.png';

test.describe('미디어 업로드 디버깅', () => {
  test('Editor 업로드 - 네트워크 로그 포함', async ({ page }) => {
    const uploadRequests: any[] = [];
    const uploadResponses: any[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/media/upload')) {
        console.log('📤 업로드 요청:', request.url());
        console.log('   Method:', request.method());
        console.log('   Headers:', JSON.stringify(request.headers(), null, 2));
        uploadRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
        });
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/media/upload')) {
        console.log('📥 업로드 응답:', response.url());
        console.log('   Status:', response.status());
        
        try {
          const body = await response.json();
          console.log('   Body:', JSON.stringify(body, null, 2));
          uploadResponses.push({
            url: response.url(),
            status: response.status(),
            body,
          });
        } catch (error) {
          console.log('   Body: (파싱 실패)', error);
        }
      }
    });

    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== 페이지 로드 완료 ===\n');

    const heroSection = page.locator('[data-section-key="hero"]');
    await expect(heroSection).toBeVisible({ timeout: 10000 });

    const fileInput = heroSection.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    console.log('📁 파일 업로드 시작...\n');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    await page.waitForTimeout(8000);

    console.log('\n=== 업로드 요청/응답 요약 ===');
    console.log('요청 수:', uploadRequests.length);
    console.log('응답 수:', uploadResponses.length);

    if (uploadResponses.length > 0) {
      const lastResponse = uploadResponses[uploadResponses.length - 1];
      console.log('\n최종 응답:');
      console.log(JSON.stringify(lastResponse, null, 2));
    }

    const allImages = await page.locator('img').all();
    console.log('\n=== 페이지 내 이미지 목록 ===');
    for (let i = 0; i < Math.min(allImages.length, 10); i++) {
      const src = await allImages[i].getAttribute('src');
      const alt = await allImages[i].getAttribute('alt');
      console.log(`${i + 1}. src="${src}" alt="${alt}"`);
    }

    const heroImages = await heroSection.locator('img').all();
    console.log('\n=== Hero 섹션 이미지 ===');
    for (let i = 0; i < heroImages.length; i++) {
      const src = await heroImages[i].getAttribute('src');
      const alt = await heroImages[i].getAttribute('alt');
      console.log(`${i + 1}. src="${src}" alt="${alt}"`);
    }

    if (uploadResponses.length > 0) {
      const lastResponse = uploadResponses[uploadResponses.length - 1];
      if (lastResponse.body && lastResponse.body.url) {
        const uploadedUrl = lastResponse.body.url;
        console.log('\n=== 업로드된 URL 검증 ===');
        console.log('URL:', uploadedUrl);
        console.log('r2.dev 포함:', uploadedUrl.includes('r2.dev'));
        console.log('cloudflare 포함:', uploadedUrl.includes('cloudflare'));

        const imageWithUploadedUrl = page.locator(`img[src="${uploadedUrl}"]`);
        const isVisible = await imageWithUploadedUrl.isVisible().catch(() => false);
        console.log('페이지에 표시됨:', isVisible);

        if (!isVisible) {
          console.log('\n⚠️ 업로드된 URL이 페이지에 표시되지 않음');
          console.log('이는 프론트엔드가 업로드 응답을 무시하고 있음을 의미합니다.');
        }
      }
    } else {
      console.log('\n⚠️ 업로드 API 호출이 발생하지 않음');
      console.log('이는 프론트엔드가 실제 업로드를 수행하지 않고 있음을 의미합니다.');
    }
  });
});
