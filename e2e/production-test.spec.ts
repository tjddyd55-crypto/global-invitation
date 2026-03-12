import { test, expect, type Page } from '@playwright/test';

const PRODUCTION_URL = 'https://insurance-production-7bd8.up.railway.app';

// 브라우저 콘솔 로그 수집
const consoleLogs: { type: string; text: string }[] = [];
const networkErrors: { url: string; status: number; statusText: string }[] = [];

test.describe('배포 환경 기본 동작 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 로그 수집
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
      }
    });

    // 네트워크 에러 수집
    page.on('response', (response) => {
      if (!response.ok() && response.status() !== 304) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });
  });

  test('1. 회원가입 또는 로그인 테스트', async ({ page }) => {
    console.log('=== 1단계: 로그인 시도 ===');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });

    // 회원가입 링크 확인
    const signupLink = page.getByRole('link', { name: /회원가입/i });
    if (await signupLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('회원가입 링크 발견 - 회원가입 시도');
      await signupLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/01-signup-page.png', fullPage: true });
      
      // 회원가입 폼 채우기
      const inputs = await page.locator('input').all();
      console.log('회원가입 페이지 input 개수:', inputs.length);
      
      // 이메일, 비밀번호 등 입력
      const emailInput = page.locator('input').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await emailInput.isVisible().catch(() => false)) {
        const testEmail = `test${Date.now()}@example.com`;
        await emailInput.fill(testEmail);
        console.log('이메일 입력:', testEmail);
      }
      
      if (await passwordInput.isVisible().catch(() => false)) {
        await passwordInput.fill('TestPassword123!');
        console.log('비밀번호 입력 완료');
      }
      
      await page.screenshot({ path: 'test-results/02-signup-filled.png', fullPage: true });
      
      const submitButton = page.getByRole('button', { name: /회원가입|가입|sign up/i });
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/03-after-signup.png', fullPage: true });
        console.log('회원가입 버튼 클릭 완료');
        console.log('회원가입 후 URL:', page.url());
      }
    } else {
      // 로그인 시도
      const emailInput = page.locator('input').first();
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.getByRole('button', { name: /로그인/i });

      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('로그인 폼 발견');
        
        // 테스트 계정으로 로그인 시도
        await emailInput.fill('test@example.com');
        await passwordInput.fill('testpassword123');
        
        await page.screenshot({ path: 'test-results/02-login-filled.png', fullPage: true });
        
        if (await loginButton.isVisible().catch(() => false)) {
          await loginButton.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });
          console.log('로그인 후 URL:', page.url());
        }
      }
    }

    console.log('콘솔 에러:', consoleLogs);
    console.log('네트워크 에러:', networkErrors);
  });

  test('2. 대시보드 -> 신청서 작성 이동', async ({ page }) => {
    console.log('=== 2단계: 대시보드 및 신청서 작성 이동 ===');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 대시보드 찾기
    const dashboardLink = page.getByRole('link', { name: /대시보드|dashboard/i });
    const createButton = page.getByRole('button', { name: /신청서 작성|작성|create|new/i });
    const createLink = page.getByRole('link', { name: /신청서 작성|작성|create|new/i });

    await page.screenshot({ path: 'test-results/04-dashboard-search.png', fullPage: true });

    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('대시보드 링크 발견');
      await dashboardLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/05-dashboard.png', fullPage: true });
    }

    // 신청서 작성 버튼 찾기
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('신청서 작성 버튼 발견');
      await createButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/06-create-form.png', fullPage: true });
    } else if (await createLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('신청서 작성 링크 발견');
      await createLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/06-create-form.png', fullPage: true });
    } else {
      console.log('신청서 작성 버튼/링크를 찾을 수 없음');
      
      // 페이지의 모든 버튼과 링크 출력
      const buttons = await page.locator('button').allTextContents();
      const links = await page.locator('a').allTextContents();
      console.log('페이지의 버튼들:', buttons);
      console.log('페이지의 링크들:', links.slice(0, 10));
    }

    console.log('콘솔 에러:', consoleLogs);
    console.log('네트워크 에러:', networkErrors);
  });

  test('3. 필수 입력 및 저장 테스트', async ({ page }) => {
    console.log('=== 3단계: 필수 입력 및 저장 테스트 ===');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 신청서 작성 페이지로 이동 (URL 직접 추정)
    const possibleUrls = [
      `${PRODUCTION_URL}/form`,
      `${PRODUCTION_URL}/application`,
      `${PRODUCTION_URL}/create`,
      `${PRODUCTION_URL}/new`,
      `${PRODUCTION_URL}/dashboard/new`,
    ];

    let formPageFound = false;
    for (const url of possibleUrls) {
      try {
        await page.goto(url);
        await page.waitForTimeout(2000);
        
        const ownerInput = page.locator('input[name*="owner"], input[placeholder*="소유자"], input[label*="소유자"]');
        const vehicleInput = page.locator('input[name*="vehicle"], input[name*="car"], input[placeholder*="차량"], input[placeholder*="번호"]');
        
        if (await ownerInput.isVisible({ timeout: 3000 }).catch(() => false) || 
            await vehicleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('신청서 폼 발견:', url);
          formPageFound = true;
          break;
        }
      } catch (e) {
        console.log(`${url} 접근 실패`);
      }
    }

    await page.screenshot({ path: 'test-results/07-form-page.png', fullPage: true });

    if (!formPageFound) {
      console.log('신청서 폼을 찾을 수 없음. 페이지 구조 확인 필요');
      console.log('현재 URL:', page.url());
      console.log('페이지 제목:', await page.title());
      
      // 모든 input 필드 출력
      const inputs = await page.locator('input').all();
      console.log('페이지의 input 개수:', inputs.length);
      for (let i = 0; i < Math.min(inputs.length, 10); i++) {
        const name = await inputs[i].getAttribute('name');
        const placeholder = await inputs[i].getAttribute('placeholder');
        const type = await inputs[i].getAttribute('type');
        console.log(`Input ${i}:`, { name, placeholder, type });
      }
    } else {
      // 필수 입력 필드 채우기
      const ownerInput = page.locator('input[name*="owner"], input[placeholder*="소유자"]').first();
      const vehicleInput = page.locator('input[name*="vehicle"], input[name*="car"], input[placeholder*="차량"]').first();
      
      if (await ownerInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await ownerInput.fill('홍길동');
        console.log('소유자명 입력 완료');
      }
      
      if (await vehicleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await vehicleInput.fill('12가3456');
        console.log('차량번호 입력 완료');
      }

      await page.screenshot({ path: 'test-results/08-form-filled.png', fullPage: true });

      // 저장 버튼 찾기 및 클릭
      const saveButton = page.getByRole('button', { name: /저장|save|submit/i });
      
      if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('저장 버튼 발견');
        
        // 네트워크 응답 감시
        const saveResponse = page.waitForResponse(
          (response) => response.url().includes('/api/') && response.request().method() === 'POST',
          { timeout: 10000 }
        ).catch(() => null);

        await saveButton.click();
        console.log('저장 버튼 클릭 완료');
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/09-after-save.png', fullPage: true });

        // 응답 확인
        const response = await saveResponse;
        if (response) {
          console.log('저장 API 응답:', {
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
          });
          
          try {
            const responseBody = await response.json();
            console.log('응답 본문:', JSON.stringify(responseBody, null, 2));
          } catch (e) {
            console.log('응답 본문 파싱 실패');
          }
        } else {
          console.log('저장 API 응답을 받지 못함');
        }

        // 성공/실패 메시지 확인
        const successMessage = page.locator('text=/저장.*성공|success/i');
        const errorMessage = page.locator('text=/오류|error|실패|fail/i');
        
        if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ 저장 성공 메시지 확인');
        } else if (await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
          const errorText = await errorMessage.textContent();
          console.log('❌ 저장 실패 메시지:', errorText);
        } else {
          console.log('⚠️ 저장 결과 메시지를 찾을 수 없음');
        }
      } else {
        console.log('저장 버튼을 찾을 수 없음');
        const buttons = await page.locator('button').allTextContents();
        console.log('페이지의 버튼들:', buttons);
      }
    }

    console.log('콘솔 에러:', consoleLogs);
    console.log('네트워크 에러:', networkErrors);
  });

  test('4. 결과보기 버튼 테스트', async ({ page }) => {
    console.log('=== 4단계: 결과보기 버튼 테스트 ===');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 결과보기 버튼 찾기
    const viewResultButton = page.getByRole('button', { name: /결과.*보기|결과|view.*result|result/i });
    const viewResultLink = page.getByRole('link', { name: /결과.*보기|결과|view.*result|result/i });

    await page.screenshot({ path: 'test-results/10-search-result-button.png', fullPage: true });

    if (await viewResultButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('결과보기 버튼 발견');
      
      const currentUrl = page.url();
      await viewResultButton.click();
      await page.waitForTimeout(3000);
      
      const newUrl = page.url();
      console.log('페이지 이동:', currentUrl, '->', newUrl);
      
      await page.screenshot({ path: 'test-results/11-result-page.png', fullPage: true });
      
      if (currentUrl !== newUrl) {
        console.log('✅ 페이지 이동 성공');
        
        // 페이지 렌더링 확인
        const hasContent = await page.locator('body *').count() > 10;
        console.log('페이지 렌더링 여부:', hasContent ? '✅ 정상' : '❌ 비정상');
      } else {
        console.log('⚠️ 페이지 이동하지 않음');
      }
    } else if (await viewResultLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('결과보기 링크 발견');
      
      const currentUrl = page.url();
      await viewResultLink.click();
      await page.waitForTimeout(3000);
      
      const newUrl = page.url();
      console.log('페이지 이동:', currentUrl, '->', newUrl);
      
      await page.screenshot({ path: 'test-results/11-result-page.png', fullPage: true });
      
      if (currentUrl !== newUrl) {
        console.log('✅ 페이지 이동 성공');
        
        const hasContent = await page.locator('body *').count() > 10;
        console.log('페이지 렌더링 여부:', hasContent ? '✅ 정상' : '❌ 비정상');
      } else {
        console.log('⚠️ 페이지 이동하지 않음');
      }
    } else {
      console.log('결과보기 버튼/링크를 찾을 수 없음');
      
      const buttons = await page.locator('button').allTextContents();
      const links = await page.locator('a').allTextContents();
      console.log('페이지의 버튼들:', buttons);
      console.log('페이지의 링크들:', links.slice(0, 10));
    }

    console.log('콘솔 에러:', consoleLogs);
    console.log('네트워크 에러:', networkErrors);
  });

  test.afterEach(async () => {
    // 최종 요약 출력
    console.log('\n=== 테스트 요약 ===');
    console.log('총 콘솔 에러:', consoleLogs.length);
    console.log('총 네트워크 에러:', networkErrors.length);
    
    if (consoleLogs.length > 0) {
      console.log('\n콘솔 에러 목록:');
      consoleLogs.forEach((log, i) => {
        console.log(`${i + 1}. [${log.type}] ${log.text}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n네트워크 에러 목록:');
      networkErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.status} ${err.statusText} - ${err.url}`);
      });
    }
  });
});
