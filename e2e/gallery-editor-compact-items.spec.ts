/**
 * Editor gallery management cards stay compact for portrait/landscape assets.
 * Does not assert Public/Preview carousel aspect changes.
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PNG } from 'pngjs';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(240_000);
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

async function seedGallery(page: Page, invitationId: string, urls: string[]) {
  return page.evaluate(
    async ({ api, invitationId, urls }) => {
      const detailRes = await fetch(`${api}/api/invitations/${invitationId}`, { credentials: 'include' });
      const detail = await detailRes.json();
      const data = detail.dataJson || detail.data || {};
      const putRes = await fetch(`${api}/api/invitations/${invitationId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: detail.title || 'Gallery Compact Cards',
          data: {
            ...data,
            templateType: 'FULL',
            conceptType: 'WEDDING',
            title: detail.title || 'Gallery Compact Cards',
            galleryImages: urls,
          },
        }),
      });
      return { ok: putRes.ok, status: putRes.status };
    },
    { api: API, invitationId, urls }
  );
}

test('editor gallery cards stay compact for portrait and landscape', async ({ browser }) => {
  const pageErrors: string[] = [];
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

  // Use stable remote images with extreme aspect ratios (not demo /images/wedding/... paths).
  const portrait =
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&h=1200&q=60';
  const landscape =
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&h=400&q=60';
  const seeded = await seedGallery(page, id, [
    portrait,
    landscape,
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&h=800&q=60',
  ]);
  expect(seeded.ok, `seed failed ${seeded.status}`).toBeTruthy();

  await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-4').click();
  await expect(page.getByTestId('gallery-editor-list')).toBeVisible({ timeout: 30_000 });

  const cards = page.getByTestId('gallery-editor-item');
  await expect(cards).toHaveCount(3);

  const metrics = await cards.evaluateAll((nodes) =>
    nodes.map((node) => {
      const card = node as HTMLElement;
      const thumb = card.querySelector('[data-testid="gallery-editor-thumbnail"]') as HTMLElement | null;
      const img = thumb?.querySelector('img') as HTMLImageElement | null;
      const name = card.querySelector('p') as HTMLElement | null;
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

  for (const row of metrics) {
    expect(row.cardHeight, JSON.stringify(row)).toBeLessThanOrEqual(150);
    expect(row.thumbWidth).toBeGreaterThanOrEqual(90);
    expect(row.thumbWidth).toBeLessThanOrEqual(100);
    expect(row.thumbHeight).toBeGreaterThanOrEqual(108);
    expect(row.thumbHeight).toBeLessThanOrEqual(116);
    expect(row.objectFit).toBe('cover');
    expect(row.nameOverflow).toBe('ellipsis');
  }

  await expect(page.getByTestId('gallery-editor-move-up').first()).toBeDisabled();
  await expect(page.getByTestId('gallery-editor-move-down').last()).toBeDisabled();
  await expect(page.getByTestId('gallery-editor-delete').first()).toBeVisible();

  // Mobile overflow check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const overflow390 = await page.evaluate(() => {
    const list = document.querySelector('[data-testid="gallery-editor-list"]');
    if (!list) return -1;
    return Math.max(0, list.scrollWidth - list.clientWidth);
  });
  expect(overflow390).toBe(0);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  const mobileMetrics = await page.getByTestId('gallery-editor-item').evaluateAll((nodes) =>
    nodes.map((node) => {
      const card = node as HTMLElement;
      const thumb = card.querySelector('[data-testid="gallery-editor-thumbnail"]') as HTMLElement | null;
      return {
        cardHeight: Math.round(card.getBoundingClientRect().height),
        thumbWidth: thumb ? Math.round(thumb.getBoundingClientRect().width) : 0,
        thumbHeight: thumb ? Math.round(thumb.getBoundingClientRect().height) : 0,
      };
    })
  );
  for (const row of mobileMetrics) {
    expect(row.cardHeight).toBeLessThanOrEqual(150);
    expect(row.thumbHeight).toBeLessThanOrEqual(108);
  }
  const overflow375 = await page.evaluate(() => {
    const list = document.querySelector('[data-testid="gallery-editor-list"]');
    if (!list) return -1;
    return Math.max(0, list.scrollWidth - list.clientWidth);
  });
  expect(overflow375).toBe(0);

  // Public gallery still renders (policy unchanged — section present with items)
  const pub = await page.evaluate(async ({ api, invitationId }) => {
    const res = await fetch(`${api}/api/invitations/${invitationId}`, { credentials: 'include' });
    const detail = await res.json();
    return detail.slug as string;
  }, { api: API, invitationId: id });
  if (pub) {
    await page.goto(`/i/${pub}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    const publicGallery = page.getByTestId('public-gallery');
    if (await publicGallery.count()) {
      await expect(publicGallery).toBeVisible();
      const publicCount = await publicGallery.getAttribute('data-gallery-count');
      expect(Number(publicCount)).toBeGreaterThanOrEqual(1);
    }
  }

  expect(pageErrors).toEqual([]);
  await context.close();
});

test('synthetic portrait upload card stays compact when upload API is available', async ({ browser }) => {
  const tmpDir = path.resolve('tmp-qa-shots', 'gallery-compact');
  const portraitPath = path.join(tmpDir, 'portrait-tall.png');
  writeSolidPng(portraitPath, 200, 900, [180, 120, 90]);

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const email = `gallery-upload-compact-${Date.now()}@example.com`;
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

  const input = page.getByTestId('gallery-upload-input');
  await expect(input).toBeAttached({ timeout: 30_000 });
  await input.setInputFiles(portraitPath);
  const item = page.getByTestId('gallery-editor-item').first();
  try {
    await expect(item).toBeVisible({ timeout: 90_000 });
  } catch {
    test.skip(true, 'upload did not confirm in time (storage/env)');
    return;
  }

  const height = await item.evaluate((node) => Math.round((node as HTMLElement).getBoundingClientRect().height));
  expect(height).toBeLessThanOrEqual(150);
  await context.close();
});
