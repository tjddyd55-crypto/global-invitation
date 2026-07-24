/**
 * Design QA 화면 캡처.
 * docs/DESIGN_QA_CHECKLIST.md 기준 — 375×812 / 1440×1024.
 *
 * 사전 조건:
 * - frontend: http://localhost:3000
 * - backend: http://localhost:3001 (인증이 필요한 화면)
 *
 * 필수 env (에디터/공개/RSVP까지 캡처):
 * - DESIGN_QA_EDITOR_ID
 * - DESIGN_QA_SHARE_SLUG
 *
 * 선택 env:
 * - DESIGN_QA_SKIP_AUTH_SCREENS=1  → 인증 의존 화면 skip (QA에서는 사용하지 않음)
 */

import fs from 'fs';
import path from 'path';
import { test, expect, type Page } from '@playwright/test';

const OUT_DIR = path.resolve(__dirname, '../artifacts/design-qa');

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 1024 };
const EMPTY_STORAGE = { cookies: [] as never[], origins: [] as never[] };

const editorId = process.env.DESIGN_QA_EDITOR_ID || '';
const shareSlug = process.env.DESIGN_QA_SHARE_SLUG || '';
const skipAuthScreens = process.env.DESIGN_QA_SKIP_AUTH_SCREENS === '1';

test.setTimeout(120_000);

async function capture(page: Page, name: string) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filePath = path.join(OUT_DIR, name);
  await page.screenshot({ path: filePath, fullPage: false });
  expect(fs.existsSync(filePath)).toBeTruthy();
}

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('language', 'ko');
  });
}

async function dismissLanguageModalIfPresent(page: Page) {
  const modal = page.getByRole('dialog', { name: 'Language setup' });
  if (await modal.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /Continue|계속/i }).click().catch(async () => {
      await page.getByText('한국어').click();
      await page.getByRole('button').last().click();
    });
    await expect(modal).toBeHidden({ timeout: 10_000 });
  }
}

async function gotoSafe(page: Page, url: string) {
  await preparePage(page);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await dismissLanguageModalIfPresent(page);
  await page.waitForTimeout(800);
}

async function openEmailVerifyScreen(page: Page, nextPath: string) {
  await gotoSafe(page, `/auth/email?next=${encodeURIComponent(nextPath)}`);
  await expect(page.getByTestId('email-start-screen')).toBeVisible({ timeout: 20_000 });

  const uniqueEmail = `design-qa-capture-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const emailInput = page.getByLabel('이메일 주소');
  await emailInput.click();
  await emailInput.fill('');
  await emailInput.pressSequentially(uniqueEmail, { delay: 15 });
  await expect(emailInput).toHaveValue(uniqueEmail);

  const submit = page.getByRole('button', { name: '인증번호 받기' });
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();
  await expect(page.getByTestId('email-verify-screen')).toBeVisible({ timeout: 20_000 });
}

test.describe('Design QA screenshots — mobile 375x812', () => {
  test.describe('public / guest screens', () => {
    test.use({ viewport: MOBILE, storageState: EMPTY_STORAGE });

    test('mobile-main', async ({ page }) => {
      await gotoSafe(page, '/m');
      await capture(page, 'mobile-main.png');
    });

    test('mobile-email-start', async ({ page }) => {
      await gotoSafe(page, '/auth/email?next=%2Fm%2Ftemplates');
      await expect(page.getByTestId('email-start-screen')).toBeVisible({ timeout: 20_000 });
      await capture(page, 'mobile-email-start.png');
    });

    test('mobile-email-verify', async ({ page }) => {
      await openEmailVerifyScreen(page, '/m/templates');
      await capture(page, 'mobile-email-verify.png');
    });

    test('mobile-public-invitation', async ({ page }) => {
      test.skip(!shareSlug, 'Set DESIGN_QA_SHARE_SLUG');
      await gotoSafe(page, `/i/${shareSlug}`);
      await expect(page.getByText('이준혁').first()).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(800);
      await capture(page, 'mobile-public-invitation.png');
    });
  });

  test.describe('authenticated screens', () => {
    test.use({
      viewport: MOBILE,
      storageState: skipAuthScreens ? EMPTY_STORAGE : './e2e/.auth/user.json',
    });

    test('mobile-concept-selection', async ({ page }) => {
      test.skip(skipAuthScreens, 'Requires authenticated session');
      await gotoSafe(page, '/m/templates');
      await expect(page.getByTestId('concept-start-cta')).toBeVisible({ timeout: 20_000 });
      await capture(page, 'mobile-concept-selection.png');
    });

    test('mobile-editor', async ({ page }) => {
      test.skip(!editorId || skipAuthScreens, 'Set DESIGN_QA_EDITOR_ID');
      await gotoSafe(page, `/m/editor/${editorId}?concept=WEDDING`);
      await expect(page.getByText('결혼식 초대장 에디터').first()).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(1000);
      await capture(page, 'mobile-editor.png');
    });

    test('mobile-publish-complete', async ({ page }) => {
      test.skip(!editorId || skipAuthScreens, 'Set DESIGN_QA_EDITOR_ID');
      await gotoSafe(page, `/m/my-invitations/${editorId}/complete`);
      await page.waitForTimeout(800);
      await capture(page, 'mobile-publish-complete.png');
    });

    test('mobile-my-invitations', async ({ page }) => {
      test.skip(skipAuthScreens, 'Requires authenticated session');
      await gotoSafe(page, '/m/my-invitations');
      await page.waitForTimeout(800);
      await capture(page, 'mobile-my-invitations.png');
    });

    test('mobile-rsvp-management', async ({ page }) => {
      test.skip(!editorId || skipAuthScreens, 'Set DESIGN_QA_EDITOR_ID');
      await gotoSafe(page, `/m/my-invitations/${editorId}/rsvp`);
      await page.waitForTimeout(800);
      await capture(page, 'mobile-rsvp-management.png');
    });
  });
});

test.describe('Design QA screenshots — desktop 1440x1024', () => {
  test.describe('public / guest screens', () => {
    test.use({ viewport: DESKTOP, storageState: EMPTY_STORAGE });

    test('desktop-main', async ({ page }) => {
      await gotoSafe(page, '/pc');
      await capture(page, 'desktop-main.png');
    });

    test('desktop-email-start', async ({ page }) => {
      await gotoSafe(page, '/auth/email?next=%2Fpc%2Ftemplates');
      await expect(page.getByTestId('email-start-screen')).toBeVisible({ timeout: 20_000 });
      await capture(page, 'desktop-email-start.png');
    });

    test('desktop-email-verify', async ({ page }) => {
      await openEmailVerifyScreen(page, '/pc/templates');
      await capture(page, 'desktop-email-verify.png');
    });

    test('desktop-public-invitation', async ({ page }) => {
      test.skip(!shareSlug, 'Set DESIGN_QA_SHARE_SLUG');
      await gotoSafe(page, `/i/${shareSlug}`);
      await expect(page.getByText('이준혁').first()).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(800);
      await capture(page, 'desktop-public-invitation.png');
    });
  });

  test.describe('authenticated screens', () => {
    test.use({
      viewport: DESKTOP,
      storageState: skipAuthScreens ? EMPTY_STORAGE : './e2e/.auth/user.json',
    });

    test('desktop-concept-selection', async ({ page }) => {
      test.skip(skipAuthScreens, 'Requires authenticated session');
      await gotoSafe(page, '/pc/templates');
      await expect(page.getByTestId('concept-start-cta')).toBeVisible({ timeout: 20_000 });
      await capture(page, 'desktop-concept-selection.png');
    });

    test('desktop-editor', async ({ page }) => {
      test.skip(!editorId || skipAuthScreens, 'Set DESIGN_QA_EDITOR_ID');
      await gotoSafe(page, `/pc/editor/${editorId}?concept=WEDDING`);
      await expect(page.getByText('라이브 미리보기').first()).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(1000);
      await capture(page, 'desktop-editor.png');
    });

    test('desktop-publish-complete', async ({ page }) => {
      test.skip(!editorId || skipAuthScreens, 'Set DESIGN_QA_EDITOR_ID');
      await gotoSafe(page, `/pc/my-invitations/${editorId}/complete`);
      await page.waitForTimeout(800);
      await capture(page, 'desktop-publish-complete.png');
    });

    test('desktop-my-invitations', async ({ page }) => {
      test.skip(skipAuthScreens, 'Requires authenticated session');
      await gotoSafe(page, '/pc/my-invitations');
      await page.waitForTimeout(800);
      await capture(page, 'desktop-my-invitations.png');
    });

    test('desktop-rsvp-management', async ({ page }) => {
      test.skip(!editorId || skipAuthScreens, 'Set DESIGN_QA_EDITOR_ID');
      await gotoSafe(page, `/pc/my-invitations/${editorId}/rsvp`);
      await page.waitForTimeout(800);
      await capture(page, 'desktop-rsvp-management.png');
    });
  });
});
