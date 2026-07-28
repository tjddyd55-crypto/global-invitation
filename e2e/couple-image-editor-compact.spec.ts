/**
 * Couple Editor thumbnails stay compact for tall portrait uploads.
 * Public/Phone Preview couple CSS is intentionally unchanged.
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PNG } from 'pngjs';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(300_000);

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

test('tall couple photos stay within editor thumbnail bounds', async ({ browser }) => {
  const pageErrors: string[] = [];
  const tmpDir = path.resolve('tmp-qa-shots', 'couple-compact');
  const tallPath = path.join(tmpDir, 'couple-tall.png');
  writeSolidPng(tallPath, 400, 1600, [160, 110, 90]);

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `couple-compact-${Date.now()}@example.com`;
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
  const invitationId = created.data.id as string;

  await page.goto(`/editor/${invitationId}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-3').click();

  const fileInputs = page.locator('input[type="file"]');
  await expect(fileInputs.first()).toBeAttached({ timeout: 20_000 });
  await fileInputs.nth(0).setInputFiles(tallPath);
  await expect(page.getByTestId('editor-couple-thumbnail').first()).toBeVisible({ timeout: 60_000 });
  await fileInputs.nth(1).setInputFiles(tallPath);
  await expect(page.getByTestId('editor-couple-thumbnail')).toHaveCount(2, { timeout: 60_000 });

  const metrics = await page.evaluate(() => {
    const thumbs = Array.from(
      document.querySelectorAll('[data-testid="editor-couple-thumbnail"]')
    ) as HTMLElement[];
    return thumbs.map((thumb) => {
      const img = thumb.querySelector('img');
      const cs = img ? getComputedStyle(img) : null;
      const box = thumb.getBoundingClientRect();
      return {
        height: box.height,
        width: box.width,
        objectFit: cs?.objectFit || '',
      };
    });
  });

  expect(metrics.length).toBe(2);
  for (const m of metrics) {
    expect(m.height).toBeLessThanOrEqual(200);
    expect(m.width).toBeLessThanOrEqual(160);
    expect(m.objectFit).toBe('cover');
  }

  // Preview couple frame must still exist (ratio not asserted as editor-only change)
  await expect(
    page.locator('[data-testid="editor-live-preview-viewport"] [data-testid="couple-section"]')
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
  await context.close();
});
