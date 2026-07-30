/**
 * Admin shared music playability validation (remote development).
 * Does not print admin secrets.
 */
import { expect, test } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';

const FRONTEND_URL =
  process.env.E2E_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'https://frontend-development-1b8a.up.railway.app';
const API_BASE_URL =
  process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

const QA_OBJECT_KEY =
  'invitation/shared/music/common/522f5ab3-9a7d-4987-85a1-4441566dbe0e.mp3';

test.describe('Admin music playable validation', () => {
  test('QA placeholder URL is not browser-decodable', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const url =
        'https://cdn.platform-assets.com/invitation/shared/music/common/522f5ab3-9a7d-4987-85a1-4441566dbe0e.mp3';
      const audio = new Audio();
      audio.preload = 'metadata';
      const meta = await new Promise<{ kind: string; code: number | null }>((resolve) => {
        const timer = window.setTimeout(
          () => resolve({ kind: 'timeout', code: audio.error?.code ?? null }),
          8000
        );
        audio.addEventListener('loadedmetadata', () => {
          window.clearTimeout(timer);
          resolve({ kind: 'metadata', code: null });
        });
        audio.addEventListener('error', () => {
          window.clearTimeout(timer);
          resolve({ kind: 'error', code: audio.error?.code ?? null });
        });
        audio.src = url;
      });
      return meta;
    });
    expect(result.kind).toBe('error');
    expect(result.code).toBe(4);
  });

  test('public music library excludes tiny/unprobed tracks when authenticated', async ({
    request,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    test.skip(!email, 'E2E_USER_EMAIL required for library auth');

    const login = await request.post(`${API_BASE_URL}/api/test-login/`, {
      data: { email },
    });
    test.skip(!login.ok(), 'test-login unavailable');

    const library = await request.get(`${API_BASE_URL}/api/music-library?concept=WEDDING`);
    expect(library.status()).toBe(200);
    const tracks = (await library.json()) as Array<{
      publicUrl?: string;
      durationSeconds?: number | null;
    }>;
    for (const track of tracks) {
      expect(track.publicUrl || '').not.toContain(QA_OBJECT_KEY);
      expect((track.durationSeconds || 0) > 0).toBeTruthy();
    }
  });

  test('admin upload form requires playable metadata before submit', async ({ page }) => {
    test.skip(!process.env.ADMIN_ID || !process.env.ADMIN_PASSWORD, 'ADMIN_* required');

    await page.goto(`${FRONTEND_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('admin-login-id').fill(process.env.ADMIN_ID!);
    await page.getByTestId('admin-login-password').fill(process.env.ADMIN_PASSWORD!);
    await page.getByTestId('admin-login-submit').click();
    await page.waitForURL(/\/admin/, { timeout: 30_000 });
    await page.goto(`${FRONTEND_URL}/admin/music`, { waitUntil: 'domcontentloaded' });

    const stubPath = path.join(os.tmpdir(), 'admin-music-stub.mp3');
    const stub = Buffer.alloc(2048, 0);
    stub[0] = 0xff;
    stub[1] = 0xfb;
    stub[2] = 0x90;
    fs.writeFileSync(stubPath, stub);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(stubPath);
    await expect(page.getByText(/재생 가능한 음원|재생할 수 없는 음악/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: '음원 등록' })).toBeDisabled();
    fs.unlinkSync(stubPath);
  });
});
