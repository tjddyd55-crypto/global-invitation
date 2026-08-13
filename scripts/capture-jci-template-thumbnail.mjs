/**
 * Capture ORGANIZATION_02_JCI preview header+hero as a 4:3 thumbnail source.
 * Output: artifacts/jci-template-thumbnail-source.png
 *
 * Usage:
 *   node scripts/capture-jci-template-thumbnail.mjs
 *   PLAYWRIGHT_BASE_URL=https://frontend-development-1b8a.up.railway.app node scripts/capture-jci-template-thumbnail.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const FE =
  process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const OUT = path.resolve('artifacts/jci-template-thumbnail-source.png');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 430, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(`${FE}/templates/ORGANIZATION_02_JCI/preview`, {
  waitUntil: 'domcontentloaded',
  timeout: 90_000,
});

const doc = page.getByTestId('public-invitation-document');
await doc.waitFor({ state: 'visible', timeout: 60_000 });

const logoImg = doc.getByTestId('organization-brand-logo').locator('img').first();
await logoImg.waitFor({ state: 'visible', timeout: 30_000 });
await page.waitForFunction(
  () => {
    const img = document.querySelector(
      '[data-testid="public-invitation-document"] [data-testid="organization-brand-logo"] img'
    );
    return img instanceof HTMLImageElement && img.naturalWidth > 0;
  },
  undefined,
  { timeout: 30_000 }
);

const heroImg = doc.locator('figure img').first();
if (await heroImg.count()) {
  await heroImg.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
}

await page.waitForTimeout(600);

const box = await doc.boundingBox();
if (!box) {
  throw new Error('invitation document bounding box missing');
}

const width = Math.round(box.width);
const height = Math.round((width * 3) / 4);
await fs.mkdir(path.dirname(OUT), { recursive: true });
await page.screenshot({
  path: OUT,
  type: 'png',
  clip: {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    width,
    height,
  },
});

await browser.close();
process.stdout.write(`wrote ${OUT} (${width}x${height} css px @2x)\n`);
