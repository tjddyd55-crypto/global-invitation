/**
 * Editor step click → Phone Preview section scroll sync (Wedding 1–9).
 */
import { test, expect, type Page } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(300_000);

const WEDDING_STEPS: Array<{ stepper: string; section: string }> = [
  { stepper: 'stepper-item-0', section: 'hero' },
  { stepper: 'stepper-item-1', section: 'greeting' },
  { stepper: 'stepper-item-2', section: 'hero' },
  { stepper: 'stepper-item-3', section: 'couple' },
  { stepper: 'stepper-item-4', section: 'gallery' },
  { stepper: 'stepper-item-5', section: 'location' },
  { stepper: 'stepper-item-6', section: 'accounts' },
  { stepper: 'stepper-item-7', section: 'rsvp' },
  { stepper: 'stepper-item-8', section: 'share' },
];

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

async function createDraft(page: Page) {
  return page.evaluate(async ({ api }) => {
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
    const body = await res.json();
    return { ok: res.ok, id: body.id as string };
  }, { api: API });
}

test('wedding steps 1-9 scroll phone preview to matching sections', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `preview-sync-${Date.now()}@example.com`;
  await loginInBrowser(page, email);
  const created = await createDraft(page);
  expect(created.ok).toBeTruthy();

  await page.goto(`/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('editor-live-preview-viewport')).toBeVisible({ timeout: 30_000 });

  let previousScrollTop = -1;
  let noOpCount = 0;

  for (const step of WEDDING_STEPS) {
    await page.getByTestId(step.stepper).click();
    await page.waitForTimeout(450);

    const result = await page.evaluate((sectionId) => {
      const root = document.querySelector(
        '[data-testid="editor-live-preview-viewport"]'
      ) as HTMLElement | null;
      if (!root) return { ok: false as const, reason: 'no-viewport' };
      const target =
        (root.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement | null) ||
        (root.querySelector(`[data-preview-section="${sectionId}"]`) as HTMLElement | null);
      if (!target) return { ok: false as const, reason: `missing-${sectionId}`, scrollTop: root.scrollTop };

      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offsetFromTop = targetRect.top - rootRect.top;
      return {
        ok: true as const,
        scrollTop: root.scrollTop,
        offsetFromTop,
        sectionId,
      };
    }, step.section);

    expect(result.ok, `${step.stepper} → ${step.section}: ${JSON.stringify(result)}`).toBeTruthy();
    if (!result.ok) continue;

    // hero may stay near 0; other sections should move unless already at top
    if (step.section !== 'hero' && previousScrollTop >= 0) {
      const moved =
        Math.abs(result.scrollTop - previousScrollTop) > 8 || Math.abs(result.offsetFromTop) < 80;
      if (!moved) noOpCount += 1;
    }
    expect(Math.abs(result.offsetFromTop)).toBeLessThan(120);
    previousScrollTop = result.scrollTop;
  }

  expect(noOpCount).toBe(0);
  expect(pageErrors).toEqual([]);
  await context.close();
});
