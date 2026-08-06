/**
 * WEDDING account / RSVP horizontal inset alignment (development).
 */
import { test, expect, type Page } from '@playwright/test';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

const TEMPLATES = ['WEDDING_04_EDITORIAL', 'WEDDING_05_GARDEN', 'WEDDING_06_NIGHT'] as const;
const VIEWPORTS = [
  { name: '360', width: 360, height: 800, minInset: 16 },
  { name: '375', width: 375, height: 812, minInset: 20 },
  { name: '390', width: 390, height: 844, minInset: 20 },
] as const;

async function measureInsets(page: Page) {
  return page.evaluate(() => {
    const pageEl = document.querySelector('[data-testid="public-invitation-document"]') as HTMLElement | null;
    const account = document.querySelector('[data-testid="invitation-accounts"]') as HTMLElement | null;
    const card = document.querySelector('[data-testid="account-card"]') as HTMLElement | null;
    const rsvp = document.querySelector('[data-testid="invitation-rsvp-section"]') as HTMLElement | null;
    const cta = document.querySelector('[data-testid="invitation-rsvp-cta"]') as HTMLElement | null;
    if (!pageEl || !account || !card || !rsvp || !cta) {
      return { ok: false as const, reason: 'missing nodes' };
    }
    const pageBox = pageEl.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    const ctaBox = cta.getBoundingClientRect();
    return {
      ok: true as const,
      pageWidth: pageBox.width,
      cardLeft: cardBox.left - pageBox.left,
      cardRight: pageBox.right - cardBox.right,
      ctaLeft: ctaBox.left - pageBox.left,
      ctaRight: pageBox.right - ctaBox.right,
      cardWidth: cardBox.width,
      ctaWidth: ctaBox.width,
      widthDelta: Math.abs(cardBox.width - ctaBox.width),
      leftDelta: Math.abs(cardBox.left - ctaBox.left),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

test.describe('wedding account/rsvp inset', () => {
  for (const id of TEMPLATES) {
    for (const vp of VIEWPORTS) {
      test(`${id} @ ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${FE}/templates/${id}/preview`, {
          waitUntil: 'networkidle',
          timeout: 90_000,
        });
        await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
        await page.getByTestId('invitation-accounts').scrollIntoViewIfNeeded();
        await page.getByTestId('invitation-rsvp-section').scrollIntoViewIfNeeded();

        const m = await measureInsets(page);
        expect(m.ok, JSON.stringify(m)).toBeTruthy();
        if (!m.ok) return;

        expect(m.cardLeft, 'account left inset').toBeGreaterThanOrEqual(vp.minInset - 1);
        expect(m.cardRight, 'account right inset').toBeGreaterThanOrEqual(vp.minInset - 1);
        expect(m.ctaLeft, 'rsvp left inset').toBeGreaterThanOrEqual(vp.minInset - 1);
        expect(m.ctaRight, 'rsvp right inset').toBeGreaterThanOrEqual(vp.minInset - 1);
        expect(m.leftDelta, 'card/cta left align').toBeLessThanOrEqual(2);
        expect(m.widthDelta, 'card/cta width align').toBeLessThanOrEqual(2);
        expect(m.overflow, 'horizontal overflow').toBeLessThanOrEqual(1);
        expect(errors, errors.join('\n')).toEqual([]);
      });
    }
  }

  test('GENERAL_04_CLEAN keeps ~24px shared inset (no wedding gutter force)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${FE}/templates/GENERAL_04_CLEAN/preview`, {
      waitUntil: 'networkidle',
      timeout: 90_000,
    });
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
    const m = await measureInsets(page);
    expect(m.ok, JSON.stringify(m)).toBeTruthy();
    if (!m.ok) return;
    // GENERAL default shared padding ~24px (not forced to 0)
    expect(m.cardLeft).toBeGreaterThanOrEqual(20);
    expect(m.ctaLeft).toBeGreaterThanOrEqual(20);
    expect(m.leftDelta).toBeLessThanOrEqual(2);
  });
});
