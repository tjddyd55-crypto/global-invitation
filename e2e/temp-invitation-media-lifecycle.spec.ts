/**
 * Hero/Profile/Gallery media delete lifecycle — persist-then-delete ordering.
 * Targets development FE/BE. Uses QA users only.
 */
import { test, expect, type Page, type Request, type Response } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PNG } from 'pngjs';

const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(360_000);
test.use({ baseURL: FE, storageState: { cookies: [], origins: [] } });

function writeSolidPng(filePath: string, rgb: [number, number, number]) {
  const png = new PNG({ width: 320, height: 240 });
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const idx = (png.width * y + x) << 2;
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
  expect(res.ok(), `test-login ${res.status()}`).toBeTruthy();
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
}

async function createWeddingInvitation(page: Page) {
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
    return { ok: res.ok, status: res.status, data: await res.json() };
  }, { api: API });
  expect(created.ok, JSON.stringify(created)).toBeTruthy();
  return created.data.id as string;
}

function trackOrdering(page: Page, invitationId: string) {
  const events: Array<{ kind: 'patch' | 'delete'; at: number; status?: number }> = [];
  page.on('request', (req: Request) => {
    if (req.method() === 'PATCH' && req.url().includes(`/api/invitations/${invitationId}`)) {
      events.push({ kind: 'patch', at: Date.now() });
    }
    if (req.method() === 'DELETE' && req.url().includes('/api/media')) {
      events.push({ kind: 'delete', at: Date.now() });
    }
  });
  page.on('response', (res: Response) => {
    const req = res.request();
    if (req.method() === 'PATCH' && req.url().includes(`/api/invitations/${invitationId}`)) {
      events.push({ kind: 'patch', at: Date.now(), status: res.status() });
    }
    if (req.method() === 'DELETE' && req.url().includes('/api/media')) {
      events.push({ kind: 'delete', at: Date.now(), status: res.status() });
    }
  });
  return events;
}

function assertPersistBeforeDelete(events: Array<{ kind: string; at: number; status?: number }>) {
  const firstPatch = events.find((e) => e.kind === 'patch');
  const firstDelete = events.find((e) => e.kind === 'delete');
  expect(firstPatch, JSON.stringify(events)).toBeTruthy();
  expect(firstDelete, JSON.stringify(events)).toBeTruthy();
  expect(firstPatch!.at, JSON.stringify(events)).toBeLessThanOrEqual(firstDelete!.at);
}

test.describe('persist-then-delete media lifecycle', () => {
  test('hero delete: persist then media delete; reload clears hero', async ({ browser }) => {
    const pageErrors: string[] = [];
    const fixture = path.resolve('tmp-qa-shots', 'hero-delete', 'hero.png');
    writeSolidPng(fixture, [180, 90, 70]);

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const email = `hero-delete-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    const id = await createWeddingInvitation(page);
    const events = trackOrdering(page, id);

    await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
    await page.getByTestId('stepper-item-2').click();

    await page.getByTestId('hero-upload-input').setInputFiles(fixture);
    await expect(page.getByTestId('hero-image-clear')).toBeVisible({ timeout: 120_000 });

    // Save once so dataJson has hero before delete race tests
    const saveBtn = page.getByRole('button', { name: /저장/ }).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(800);
    }

    events.length = 0;
    await page.getByTestId('hero-image-clear').click();
    await expect(page.getByTestId('hero-image-clear')).toHaveCount(0, { timeout: 60_000 });
    await expect.poll(() => events.some((e) => e.kind === 'delete'), { timeout: 60_000 }).toBeTruthy();
    assertPersistBeforeDelete(events);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('stepper-item-2').click();
    await expect(page.getByTestId('hero-image-clear')).toHaveCount(0, { timeout: 30_000 });

    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    await context.close();
  });

  test('groom and bride profile delete ordering', async ({ browser }) => {
    const pageErrors: string[] = [];
    const groomFile = path.resolve('tmp-qa-shots', 'couple-delete', 'groom.png');
    const brideFile = path.resolve('tmp-qa-shots', 'couple-delete', 'bride.png');
    writeSolidPng(groomFile, [40, 100, 180]);
    writeSolidPng(brideFile, [180, 80, 120]);

    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const email = `couple-delete-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    const id = await createWeddingInvitation(page);

    await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
    await page.getByTestId('stepper-item-3').click();

    await page.getByTestId('groom-upload-input').setInputFiles(groomFile);
    await expect(page.getByTestId('groom-image-clear')).toBeVisible({ timeout: 120_000 });
    await page.getByTestId('bride-upload-input').setInputFiles(brideFile);
    await expect(page.getByTestId('bride-image-clear')).toBeVisible({ timeout: 120_000 });

    const saveBtn = page.getByRole('button', { name: /저장/ }).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
    }

    const groomEvents = trackOrdering(page, id);
    await page.getByTestId('groom-image-clear').click();
    await expect(page.getByTestId('groom-image-clear')).toHaveCount(0, { timeout: 60_000 });
    await expect.poll(() => groomEvents.some((e) => e.kind === 'delete'), { timeout: 60_000 }).toBeTruthy();
    assertPersistBeforeDelete(groomEvents);

    const brideEvents: typeof groomEvents = [];
    page.on('request', (req: Request) => {
      if (req.method() === 'PATCH' && req.url().includes(`/api/invitations/${id}`)) {
        brideEvents.push({ kind: 'patch', at: Date.now() });
      }
      if (req.method() === 'DELETE' && req.url().includes('/api/media')) {
        brideEvents.push({ kind: 'delete', at: Date.now() });
      }
    });
    await page.getByTestId('bride-image-clear').click();
    await expect(page.getByTestId('bride-image-clear')).toHaveCount(0, { timeout: 60_000 });
    await expect.poll(() => brideEvents.some((e) => e.kind === 'delete'), { timeout: 60_000 }).toBeTruthy();
    assertPersistBeforeDelete(brideEvents);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('stepper-item-3').click();
    await expect(page.getByTestId('groom-image-clear')).toHaveCount(0);
    await expect(page.getByTestId('bride-image-clear')).toHaveCount(0);

    expect(pageErrors).toEqual([]);
    await context.close();
  });

  test('persist failure rolls back hero and skips media delete', async ({ browser }) => {
    const pageErrors: string[] = [];
    const fixture = path.resolve('tmp-qa-shots', 'hero-persist-fail', 'hero.png');
    writeSolidPng(fixture, [90, 140, 60]);

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const email = `hero-persist-fail-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    const id = await createWeddingInvitation(page);

    await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('stepper-item-2').click();
    await page.getByTestId('hero-upload-input').setInputFiles(fixture);
    await expect(page.getByTestId('hero-image-clear')).toBeVisible({ timeout: 120_000 });

    const saveBtn = page.getByRole('button', { name: /저장/ }).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(800);
    }

    let deleteCount = 0;
    await page.route(`**/api/invitations/${id}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'FORCED_SAVE_FAILURE' }),
        });
        return;
      }
      await route.continue();
    });
    page.on('request', (req) => {
      if (req.method() === 'DELETE' && req.url().includes('/api/media')) deleteCount += 1;
    });

    await page.getByTestId('hero-image-clear').click();
    await expect(page.getByTestId('image-uploader-error')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('hero-image-clear')).toBeVisible();
    expect(deleteCount).toBe(0);

    expect(pageErrors).toEqual([]);
    await context.close();
  });

  test('delete failure keeps hero cleared after successful persist', async ({ browser }) => {
    const pageErrors: string[] = [];
    const fixture = path.resolve('tmp-qa-shots', 'hero-delete-fail', 'hero.png');
    writeSolidPng(fixture, [120, 60, 160]);

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const email = `hero-delete-fail-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    const id = await createWeddingInvitation(page);

    await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('stepper-item-2').click();
    await page.getByTestId('hero-upload-input').setInputFiles(fixture);
    await expect(page.getByTestId('hero-image-clear')).toBeVisible({ timeout: 120_000 });

    const saveBtn = page.getByRole('button', { name: /저장/ }).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(800);
    }

    await page.route('**/api/media', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'FORCED_DELETE_FAILURE' }),
        });
        return;
      }
      await route.continue();
    });

    await page.getByTestId('hero-image-clear').click();
    await expect(page.getByTestId('hero-image-clear')).toHaveCount(0, { timeout: 60_000 });
    await expect(page.getByTestId('image-uploader-cleanup-warning')).toBeVisible({ timeout: 30_000 });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('stepper-item-2').click();
    await expect(page.getByTestId('hero-image-clear')).toHaveCount(0, { timeout: 30_000 });

    expect(pageErrors).toEqual([]);
    await context.close();
  });

  test('step back and reload keep uploaded gallery without cleanup API', async ({ browser }) => {
    const pageErrors: string[] = [];
    const fixture = path.resolve('tmp-qa-shots', 'gallery-nav', 'g1.png');
    writeSolidPng(fixture, [50, 120, 90]);

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const email = `gallery-nav-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    const id = await createWeddingInvitation(page);

    let mediaDeletes = 0;
    page.on('request', (req) => {
      if (req.method() === 'DELETE' && req.url().includes('/api/media')) mediaDeletes += 1;
    });

    await page.goto(`/editor/${id}?concept=WEDDING`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('stepper-item-4').click();
    await page.getByTestId('gallery-upload-input').setInputFiles(fixture);
    await expect(page.getByTestId('gallery-editor-item')).toHaveCount(1, { timeout: 120_000 });

    const deletesAfterUpload = mediaDeletes;
    await page.getByTestId('stepper-item-3').click();
    await page.getByTestId('stepper-item-4').click();
    await expect(page.getByTestId('gallery-editor-item')).toHaveCount(1, { timeout: 30_000 });
    expect(mediaDeletes).toBe(deletesAfterUpload);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('stepper-item-4').click();
    await expect(page.getByTestId('gallery-editor-item')).toHaveCount(1, { timeout: 60_000 });
    expect(mediaDeletes).toBe(deletesAfterUpload);

    expect(pageErrors).toEqual([]);
    await context.close();
  });
});
