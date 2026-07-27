/**
 * Figma entry/auth flow — structural assertions on development Frontend.
 */
import { test, expect } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

const LEGACY = [
  'Global Invitation 데스크톱',
  '모바일 버전 보기',
  '테스트룸',
  'FULL 엔진 시작',
  'Invitation Full Engine',
];

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe('Figma entry/auth desktop', () => {
  test.use({ viewport: { width: 1440, height: 1024 } });

  test('Main / — Invite marketing, no sidebar', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(800);
    const body = await page.locator('body').innerText();
    for (const needle of LEGACY) expect(body).not.toContain(needle);
    await expect(page.getByText('Invite').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /초대장 만들기/ }).or(page.getByRole('link', { name: /초대장 만들기/ })).first()).toBeVisible();
    expect(await page.locator('aside').count()).toBe(0);
    await assertNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });

  test('Concept /create/concept — auth gate or concept cards', async ({ page }) => {
    await page.goto(`${FE}/create/concept`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(800);
    expect(await page.locator('aside').count()).toBe(0);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('Global Invitation 데스크톱');
    // Either auth redirect/gate or concept UI
    const hasConcept = body.includes('어떤 초대장을');
    const hasAuth = body.includes('이메일') || page.url().includes('/auth/');
    expect(hasConcept || hasAuth).toBeTruthy();
  });

  test('Email Start /auth/email — Invite + auth card', async ({ page }) => {
    await page.goto(`${FE}/auth/email?next=/create/concept`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(600);
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/Invite|이메일/);
    expect(body).toContain('이메일');
    expect(body).not.toMatch(/^GLOBAL INVITATION$/m);
    expect(await page.locator('aside').count()).toBe(0);
    await assertNoHorizontalOverflow(page);
  });
});

test.describe('Figma entry/auth mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Main mobile — no desktop sidebar, Invite brand', async ({ page }) => {
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(600);
    expect(await page.locator('aside').count()).toBe(0);
    const body = await page.locator('body').innerText();
    expect(body).toContain('Invite');
    expect(body).not.toContain('테스트룸');
    await assertNoHorizontalOverflow(page);
  });

  test('Email Start mobile — no overflow', async ({ page }) => {
    await page.goto(`${FE}/auth/email?next=/create/concept`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(500);
    await assertNoHorizontalOverflow(page);
    await expect(page.getByText(/이메일/).first()).toBeVisible();
  });
});

test.describe('Breakpoint 1023/1024', () => {
  test('1023 uses mobile main presentation', async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(500);
    expect(await page.locator('aside').count()).toBe(0);
  });

  test('1024 uses desktop marketing header', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(500);
    expect(await page.locator('aside').count()).toBe(0);
    const body = await page.locator('body').innerText();
    expect(body).toContain('Invite');
  });
});
