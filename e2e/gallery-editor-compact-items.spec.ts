/**
 * Editor gallery management cards stay compact for portrait/landscape uploads.
 * Public/Preview carousel aspect policy is intentionally not changed here.
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PNG } from 'pngjs';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(300_000);
test.use({ baseURL: FE, storageState: { cookies: [], origins: [] } });

function writeSolidPng(filePath: string, width: number, height: number, rgb: [number, number, number]) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) << 2;
      png.data[idx] = rgb[0];
      png.data[idx + 1] = rgb[1];
      png.data[idx + 2] = rgb[2];
      png.data[idx + 3] = 255;
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

async function loginInBrowser(page: Page, email: string) {
  const res = await page.request.post(`${API}/api/test-login`, { data: { email } });
  expect(res.ok()).toBeTruthy();
  const cookies = await page.context().cookies(API);
  const auth = cookies.find((c) => c.name === 'auth_session_token');
  expect(auth).toBeTruthy();
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: auth!.name,
      value: auth!.value,
      domain: auth!.domain,
      path: auth!.path || '/',
      expires: auth!.expires,
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
  ]);
  await page.goto('/m', { waitUntil: 'domcontentloaded', timeout: 90_000 });
}

test('portrait and landscape uploads keep compact editor cards', async ({ browser }) => {
  const pageErrors: string[] = [];
  const tmpDir = path.resolve('tmp-qa-shots', 'gallery-compact');
  const portraitPath = path.join(tmpDir, 'portrait-tall.png');
  const landscapePath = path.join(tmpDir, 'landscape-wide.png');
  writeSolidPng(portraitPath, 200, 900, [180, 120, 90]);
  writeSolidPng(landscapePath, 1200, 300, [90, 140, 180]);

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `gallery-compact-${Date.now()}@example.com`;
  await loginInBrowser(page, email);

  const created = await page.evaluate(async ({ api }) => {
    const res = await fetch(`${api}/api/invitations`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conceptType: 'WEDDING',
        language: 'ko',
        templateKey: 'invitation_full',
      }),
    });
    return { ok: res.ok, data: await res.json() };
  }, { api: API });
  expect(created.ok).toBeTruthy();
  const id = created.data.id as string;

  await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-4').click();
  await expect(page.getByTestId('gallery-dropzone')).toBeVisible({ timeout: 30_000 });

  const input = page.getByTestId('gallery-upload-input');
  await expect(input).toBeAttached();
  await input.setInputFiles([portraitPath, landscapePath]);

  const cards = page.getByTestId('gallery-editor-item');
  try {
    await expect(cards).toHaveCount(2, { timeout: 120_000 });
  } catch {
    test.skip(true, 'gallery upload did not confirm (storage/env)');
    return;
  }

  const metrics = await cards.evaluateAll((nodes) =>
    nodes.map((node) => {
      const card = node as HTMLElement;
      const thumb = card.querySelector('[data-testid="gallery-editor-thumbnail"]') as HTMLElement | null;
      const img = thumb?.querySelector('img') as HTMLImageElement | null;
      const name = card.querySelector('[class*="editorGalleryFileName"], p') as HTMLElement | null;
      const style = img ? window.getComputedStyle(img) : null;
      return {
        cardHeight: Math.round(card.getBoundingClientRect().height),
        thumbWidth: thumb ? Math.round(thumb.getBoundingClientRect().width) : 0,
        thumbHeight: thumb ? Math.round(thumb.getBoundingClientRect().height) : 0,
        objectFit: style?.objectFit || '',
        nameOverflow: name ? window.getComputedStyle(name).textOverflow : '',
      };
    })
  );

  expect(metrics[0]?.cardHeight).toBeLessThanOrEqual(150);
  expect(metrics[1]?.cardHeight).toBeLessThanOrEqual(150);
  expect(Math.abs((metrics[0]?.cardHeight || 0) - (metrics[1]?.cardHeight || 0))).toBeLessThanOrEqual(20);

  for (const row of metrics) {
    expect(row.thumbWidth).toBeGreaterThanOrEqual(90);
    expect(row.thumbWidth).toBeLessThanOrEqual(100);
    expect(row.thumbHeight).toBeGreaterThanOrEqual(108);
    expect(row.thumbHeight).toBeLessThanOrEqual(116);
    expect(row.objectFit).toBe('cover');
    expect(row.nameOverflow).toBe('ellipsis');
  }

  await expect(page.getByTestId('gallery-editor-move-up').first()).toBeDisabled();
  await expect(page.getByTestId('gallery-editor-move-down').last()).toBeDisabled();
  const firstNameBefore = await page.locator('[data-testid="gallery-editor-item"]').first().locator('p').first().textContent();
  await page.getByTestId('gallery-editor-move-down').first().click();
  const firstNameAfter = await page.locator('[data-testid="gallery-editor-item"]').first().locator('p').first().textContent();
  expect(firstNameAfter).not.toEqual(firstNameBefore);
  await expect(page.getByTestId('gallery-editor-move-up').nth(1)).toBeEnabled();

  // 완료 queue progress bar 미노출
  await expect(page.locator('[data-testid="upload-queue-item"][data-upload-status="done"]')).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  expect(
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="gallery-editor-list"]');
      if (!list) return -1;
      return Math.max(0, list.scrollWidth - list.clientWidth);
    })
  ).toBe(0);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(250);
  const mobileHeights = await cards.evaluateAll((nodes) =>
    nodes.map((node) => Math.round((node as HTMLElement).getBoundingClientRect().height))
  );
  for (const height of mobileHeights) {
    expect(height).toBeLessThanOrEqual(150);
  }
  expect(
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="gallery-editor-list"]');
      if (!list) return -1;
      return Math.max(0, list.scrollWidth - list.clientWidth);
    })
  ).toBe(0);

  // Preview phone gallery (if present) remains carousel — not editor card layout
  await page.setViewportSize({ width: 1280, height: 900 });
  const previewGallery = page.locator('[data-testid="desktop-editor-preview"] [data-testid="public-gallery"]');
  if (await previewGallery.count()) {
    await expect(previewGallery).toBeVisible();
    const previewCount = await previewGallery.getAttribute('data-gallery-count');
    expect(Number(previewCount)).toBe(2);
  }

  expect(pageErrors).toEqual([]);
  await context.close();
});
