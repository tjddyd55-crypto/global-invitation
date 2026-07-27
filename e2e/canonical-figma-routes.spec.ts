/**
 * Canonical route regression — Figma Main / Concept (no Legacy marketing / FULL engine).
 */
import { test, expect } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

const LEGACY_HOME = [
  '디지털 초대장과 메시지를 한 곳에서',
  'Digital invitations and messages, all in one place',
  'Self Basic',
  'Self Plus',
  '가격 요약',
  'Pricing summary',
];

const LEGACY_TEMPLATES = [
  'FULL 엔진 시작',
  'Invitation Full Engine',
  'FULL · Concept-driven',
];

test.describe('Canonical Figma routes', () => {
  for (const viewport of [
    { name: 'mobile390', width: 390, height: 844 },
    { name: 'desktop1440', width: 1440, height: 1024 },
  ]) {
    test(`home ${viewport.name} is Figma Main (not Legacy marketing)`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        baseURL: FE,
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await page.waitForTimeout(800);
      const body = await page.locator('body').innerText();
      for (const needle of LEGACY_HOME) {
        expect(body, `legacy home: ${needle}`).not.toContain(needle);
      }
      // Figma / platform home CTA or greeting
      const hasCta =
        (await page.getByRole('link', { name: /이메일로 시작|초대장 만들기|Create|시작하기/i }).count()) > 0 ||
        (await page.getByRole('heading', { name: /Global Invitation|안녕하세요/i }).count()) > 0;
      expect(hasCta, 'Figma Main CTA/heading missing').toBeTruthy();
      expect(errors, `pageerror: ${errors.join('; ')}`).toEqual([]);
      await context.close();
    });

    test(`concept ${viewport.name} is Figma Concept (not FULL engine)`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        baseURL: FE,
      });
      const page = await context.newPage();
      await page.goto('/create/concept', { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await page.waitForTimeout(800);
      // May redirect to auth — still must not show FULL engine
      const body = await page.locator('body').innerText();
      for (const needle of LEGACY_TEMPLATES) {
        expect(body, `legacy concept: ${needle}`).not.toContain(needle);
      }
      await context.close();
    });

    test(`/templates ${viewport.name} redirects to /create/concept`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        baseURL: FE,
      });
      const page = await context.newPage();
      await page.goto('/templates', { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await page.waitForTimeout(500);
      expect(page.url()).toMatch(/\/create\/concept|\/auth\//);
      const body = await page.locator('body').innerText();
      for (const needle of LEGACY_TEMPLATES) {
        expect(body).not.toContain(needle);
      }
      await context.close();
    });
  }
});
