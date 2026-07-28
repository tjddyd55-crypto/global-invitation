/**
 * Share step desktop preview — no inner scrollbar; phone preview hidden.
 */
import { test, expect, type Page } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(240_000);

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

async function createDraftInvitation(page: Page) {
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

async function assertSharePanelNoInnerScroll(page: Page) {
  const metrics = await page.evaluate(() => {
    const column = document.querySelector('[data-testid="desktop-editor-preview"]') as HTMLElement | null;
    const panel = document.querySelector('[data-testid="desktop-share-card-preview-slot"]') as HTMLElement | null;
    const card = document.querySelector('[data-testid="invitation-share-card-preview"]') as HTMLElement | null;
    if (!column || !panel || !card) {
      return { ok: false as const, reason: 'missing-nodes' };
    }

    const csColumn = getComputedStyle(column);
    const csPanel = getComputedStyle(panel);
    const csCard = getComputedStyle(card);

    const title = card.querySelector('[data-testid="share-card-preview-title"]') as HTMLElement | null;
    const desc = card.querySelector('[data-testid="share-card-preview-description"]') as HTMLElement | null;
    const url =
      (card.querySelector('[data-testid="share-card-preview-url"]') as HTMLElement | null) ||
      (card.querySelector('[data-testid="share-card-preview-url-pending"]') as HTMLElement | null);
    const image = card.querySelector('[data-testid="share-card-preview-image"]') as HTMLElement | null;

    const fullyVisible = (el: HTMLElement | null) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
    };

    return {
      ok: true as const,
      columnOverflowY: csColumn.overflowY,
      columnMaxHeight: csColumn.maxHeight,
      panelOverflowY: csPanel.overflowY,
      panelMaxHeight: csPanel.maxHeight,
      panelHeight: csPanel.height,
      cardOverflowY: csCard.overflowY,
      columnScrollable: column.scrollHeight > column.clientHeight + 1,
      panelScrollable: panel.scrollHeight > panel.clientHeight + 1,
      phonePreviewCount: document.querySelectorAll('[data-testid="editor-live-preview-viewport"]').length,
      titleVisible: fullyVisible(title),
      descVisible: fullyVisible(desc),
      urlVisible: fullyVisible(url),
      imageVisible: fullyVisible(image),
    };
  });

  expect(metrics.ok).toBeTruthy();
  if (!metrics.ok) return;

  expect(metrics.phonePreviewCount).toBe(0);
  expect(metrics.columnOverflowY).not.toBe('auto');
  expect(metrics.columnOverflowY).not.toBe('scroll');
  expect(metrics.panelOverflowY).not.toBe('auto');
  expect(metrics.panelOverflowY).not.toBe('scroll');
  expect(metrics.cardOverflowY).not.toBe('auto');
  expect(metrics.cardOverflowY).not.toBe('scroll');
  expect(metrics.columnMaxHeight === 'none' || metrics.columnMaxHeight === '').toBeTruthy();
  expect(metrics.panelMaxHeight === 'none' || metrics.panelMaxHeight === '').toBeTruthy();
  expect(metrics.columnScrollable).toBeFalsy();
  expect(metrics.panelScrollable).toBeFalsy();
  expect(metrics.titleVisible).toBeTruthy();
  expect(metrics.descVisible).toBeTruthy();
  expect(metrics.urlVisible).toBeTruthy();
  expect(metrics.imageVisible).toBeTruthy();
}

test.describe('share preview no inner scroll', () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
  ] as const) {
    test(`desktop ${viewport.width}x${viewport.height}`, async ({ browser }) => {
      const pageErrors: string[] = [];
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.on('pageerror', (err) => pageErrors.push(err.message));

      const email = `share-noscroll-${viewport.width}-${Date.now()}@example.com`;
      await loginInBrowser(page, email);
      const created = await createDraftInvitation(page);
      expect(created.ok).toBeTruthy();

      await page.goto(`/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('desktop-editor-layout')).toBeVisible({ timeout: 60_000 });

      // Other step keeps phone preview scroll container
      await page.getByTestId('stepper-item-7').click();
      await expect(page.getByTestId('editor-live-preview-viewport')).toBeVisible({ timeout: 20_000 });
      const otherStepScroll = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="editor-live-preview-viewport"]') as HTMLElement | null;
        if (!el) return null;
        return getComputedStyle(el).overflowY;
      });
      expect(otherStepScroll === 'auto' || otherStepScroll === 'scroll' || otherStepScroll === 'overlay').toBeTruthy();

      await page.getByTestId('stepper-item-8').click();
      await expect(page.getByTestId('desktop-share-card-preview-slot')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('invitation-share-card-preview')).toBeVisible();
      await assertSharePanelNoInnerScroll(page);

      expect(pageErrors).toEqual([]);
      await context.close();
    });
  }

  test('mobile 390 share card has no inner vertical scrollbar', async ({ browser }) => {
    const pageErrors: string[] = [];
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const email = `share-noscroll-m390-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    const created = await createDraftInvitation(page);
    expect(created.ok).toBeTruthy();

    await page.goto(`/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
    await page.getByTestId('stepper-item-8').click();
    await expect(page.getByTestId('invitation-share-card-preview')).toBeVisible({ timeout: 20_000 });

    const metrics = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="invitation-share-card-preview"]') as HTMLElement | null;
      if (!card) return null;
      const cs = getComputedStyle(card);
      const doc = document.documentElement;
      return {
        overflowY: cs.overflowY,
        maxHeight: cs.maxHeight,
        scrollable: card.scrollHeight > card.clientHeight + 1,
        pageOverflowX: doc.scrollWidth > doc.clientWidth + 1,
      };
    });
    expect(metrics).toBeTruthy();
    expect(metrics!.overflowY).not.toBe('auto');
    expect(metrics!.overflowY).not.toBe('scroll');
    expect(metrics!.maxHeight === 'none' || metrics!.maxHeight === '').toBeTruthy();
    expect(metrics!.scrollable).toBeFalsy();
    expect(metrics!.pageOverflowX).toBeFalsy();
    expect(pageErrors).toEqual([]);
    await context.close();
  });
});
