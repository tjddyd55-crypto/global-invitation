import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 신규 6종 템플릿 시각 마감 QA.
 * - ISO / sample / placeholder 노출 0
 * - 가로 overflow 0
 * - 360 / 375 / 390 캡처
 *
 * 실행:
 *   PLAYWRIGHT_BASE_URL=https://frontend-development-1b8a.up.railway.app \
 *     npx playwright test e2e/visual-template-polish-qa.spec.ts
 */

const TEMPLATES = [
  'WEDDING_04_EDITORIAL',
  'WEDDING_05_GARDEN',
  'WEDDING_06_NIGHT',
  'GENERAL_04_CLEAN',
  'GENERAL_05_FESTIVE',
  'GENERAL_06_CULTURE',
] as const;

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
] as const;

const OUT_DIR = path.resolve('artifacts/visual-template-polish');

const FORBIDDEN = [
  /sample/i,
  /placeholder/i,
  /\btest\b/i,
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
  /templates\/visual\/_shared/,
];

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test.describe('visual template polish QA', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  for (const templateId of TEMPLATES) {
    for (const viewport of VIEWPORTS) {
      test(`${templateId} @ ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const errors = await collectConsoleErrors(page);

        await page.goto(`/templates/${templateId}/preview`, { waitUntil: 'networkidle' });
        await expect(page.getByTestId('visual-template-preview')).toBeVisible();
        await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 20_000 });

        const bodyText = await page.locator('body').innerText();
        for (const pattern of FORBIDDEN) {
          expect(bodyText, `forbidden pattern ${pattern} in ${templateId}`).not.toMatch(pattern);
        }

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });
        expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(1);

        const hero = page.locator('[data-preview-section="hero"], [data-section-id="hero"]').first();
        if (await hero.count()) {
          await hero.screenshot({
            path: path.join(OUT_DIR, `${templateId}-${viewport.name}-hero.png`),
          });
        }

        await page.screenshot({
          path: path.join(OUT_DIR, `${templateId}-${viewport.name}-full.png`),
          fullPage: true,
        });

        const mid = page.locator('[data-preview-section="gallery"], [data-section-id="gallery"]').first();
        if (await mid.count()) {
          await mid.scrollIntoViewIfNeeded();
          await mid.screenshot({
            path: path.join(OUT_DIR, `${templateId}-${viewport.name}-mid.png`),
          });
        }

        // map / rsvp / accounts smoke
        for (const section of ['location', 'accounts', 'rsvp'] as const) {
          const node = page.locator(`[data-preview-section="${section}"], [data-section-id="${section}"]`).first();
          if (await node.count()) {
            await node.scrollIntoViewIfNeeded();
          }
        }

        const ignoredConsole = (msg: string) =>
          msg.includes('favicon') ||
          msg.includes('status of 401') ||
          msg.includes('net::ERR_ABORTED');

        expect(errors.filter((msg) => !ignoredConsole(msg))).toEqual([]);
      });
    }
  }
});
