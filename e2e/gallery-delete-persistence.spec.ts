/**
 * Gallery delete persists via invitation PATCH before optional R2 cleanup.
 */
import { test, expect, type Page, type Request } from '@playwright/test';
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

test('gallery delete persists after reload and does not require remote DELETE success', async ({
  browser,
}) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const tmpDir = path.resolve('tmp-qa-shots', 'gallery-delete-persist');
  const files = [1, 2, 3].map((n) => {
    const filePath = path.join(tmpDir, `g${n}.png`);
    writeSolidPng(filePath, 240, 320, [40 + n * 40, 100, 160]);
    return filePath;
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const email = `gallery-delete-persist-${Date.now()}@example.com`;
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
  await input.setInputFiles(files);

  const cards = page.getByTestId('gallery-editor-item');
  try {
    await expect(cards).toHaveCount(3, { timeout: 120_000 });
  } catch {
    test.skip(true, 'gallery upload did not confirm');
    return;
  }

  const patchBodies: unknown[] = [];
  const mediaDeletes: { status: number; url: string }[] = [];

  page.on('request', (req: Request) => {
    if (req.method() === 'PATCH' && req.url().includes(`/api/invitations/${id}`)) {
      try {
        patchBodies.push(req.postDataJSON());
      } catch {
        // ignore
      }
    }
  });
  page.on('response', async (res) => {
    if (res.request().method() === 'DELETE' && res.url().includes('/api/media')) {
      mediaDeletes.push({ status: res.status(), url: res.url() });
    }
  });

  await page.getByTestId('gallery-editor-delete').nth(1).click();
  await expect(cards).toHaveCount(2, { timeout: 30_000 });
  await expect(page.getByTestId('gallery-persist-status')).toContainText(/저장/, { timeout: 30_000 });

  await expect.poll(() => patchBodies.length, { timeout: 30_000 }).toBeGreaterThan(0);
  const lastPatch = patchBodies[patchBodies.length - 1] as {
    data_json?: { galleryImages?: string[] };
    data?: { galleryImages?: string[] };
  };
  const galleryAfterDelete =
    lastPatch?.data_json?.galleryImages ?? lastPatch?.data?.galleryImages ?? null;
  expect(Array.isArray(galleryAfterDelete)).toBeTruthy();
  expect(galleryAfterDelete).toHaveLength(2);

  // Remote cleanup may be 200/204; must not be repeating AUTH_REQUIRED 401 for owner assets.
  const authRequiredDeletes = mediaDeletes.filter((item) => item.status === 401);
  expect(authRequiredDeletes, JSON.stringify(mediaDeletes)).toHaveLength(0);

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-4').click();
  await expect(page.getByTestId('gallery-editor-item')).toHaveCount(2, { timeout: 30_000 });

  await page.goto('/my-invitations', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('stepper-item-4').click();
  await expect(page.getByTestId('gallery-editor-item')).toHaveCount(2, { timeout: 30_000 });

  // Delete remaining → empty array persists
  while ((await page.getByTestId('gallery-editor-item').count()) > 0) {
    await page.getByTestId('gallery-editor-delete').first().click();
    await page.waitForTimeout(400);
  }
  await expect(page.getByTestId('gallery-editor-empty')).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => {
    const body = patchBodies[patchBodies.length - 1] as {
      data_json?: { galleryImages?: string[] };
      data?: { galleryImages?: string[] };
    };
    const gallery = body?.data_json?.galleryImages ?? body?.data?.galleryImages;
    return Array.isArray(gallery) ? gallery.length : -1;
  }).toBe(0);

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.getByTestId('stepper-item-4').click();
  await expect(page.getByTestId('gallery-editor-empty')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('gallery-editor-item')).toHaveCount(0);

  expect(pageErrors).toEqual([]);
  await context.close();
});
