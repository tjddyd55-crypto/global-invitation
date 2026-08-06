/**
 * Visual template gallery presentation parity — Preview / mode data attributes.
 *
 *   npx playwright test e2e/visual-template-gallery-parity.spec.ts --project=chromium
 */
import { expect, test } from '@playwright/test';
import { FE } from './helpers/visualTemplateAcceptance';

const CASES = [
  { id: 'WEDDING_04_EDITORIAL', expectMode: 'GRID_EXPAND', presentation: 'editorial' },
  { id: 'WEDDING_05_GARDEN', expectMode: 'GRID_EXPAND', presentation: 'garden' },
  { id: 'WEDDING_06_NIGHT', expectMode: 'SLIDE', presentation: 'night' },
  { id: 'GENERAL_04_CLEAN', expectMode: 'GRID_EXPAND', presentation: 'clean' },
  { id: 'GENERAL_05_FESTIVE', expectMode: 'GRID_EXPAND', presentation: 'festive' },
  { id: 'GENERAL_06_CULTURE', expectMode: 'SLIDE', presentation: 'culture' },
] as const;

test.describe('visual template gallery parity (template preview)', () => {
  for (const item of CASES) {
    test(`${item.id} fixture gallery presentation`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(String(err)));

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${FE}/templates/${item.id}/preview`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      });

      const preview = page.getByTestId('visual-template-preview');
      await expect(preview).toBeVisible({ timeout: 60_000 });

      const gallery = preview.getByTestId('public-gallery').first();
      await expect(gallery).toBeVisible({ timeout: 30_000 });
      await expect(gallery).toHaveAttribute('data-gallery-layout', item.expectMode);
      await expect(gallery).toHaveAttribute('data-gallery-presentation', item.presentation);

      if (item.expectMode === 'GRID_EXPAND') {
        await expect(gallery.getByTestId('gallery-grid')).toBeVisible();
      }

      expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    });
  }
});
