import { expect, test, type Page } from '@playwright/test';

const FE = process.env.E2E_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.setTimeout(180_000);

async function loginInBrowser(page: Page, email: string) {
  const res = await page.request.post(`${API}/api/test-login`, { data: { email } });
  expect(res.ok(), await res.text()).toBeTruthy();
  const cookies = await page.context().cookies(API);
  const auth = cookies.find((c) => c.name === 'auth_session_token');
  expect(auth).toBeTruthy();
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

async function createFuneralDraft(page: Page, locale: 'ko-KR' | 'en-US') {
  const create = await page.request.post(`${API}/api/invitations`, {
    data: { templateKey: 'invitation_full', conceptType: 'FUNERAL', locale },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  return (await create.json()) as { id: string; slug: string };
}

async function cleanupInvitation(page: Page, id: string) {
  const res = await page.request.delete(`${API}/api/invitations/${id}`);
  expect([200, 204, 404], await res.text()).toContain(res.status());
}

async function assertNoBodyOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      overflow: root.scrollWidth > root.clientWidth + 1,
    };
  });
  expect(overflow.overflow, JSON.stringify(overflow)).toBeFalsy();
}

async function assertCardInViewport(page: Page, padding = 8) {
  const box = await page.locator('[data-testid=mobile-editor-form] section').first().boundingBox();
  expect(box).toBeTruthy();
  const vw = page.viewportSize()!.width;
  expect(box!.x).toBeGreaterThanOrEqual(padding - 1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vw - padding + 1);
}

async function openFuneralEditor(page: Page, locale: 'ko-KR' | 'en-US') {
  const created = await createFuneralDraft(page, locale);
  await page.goto(`${FE}/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('funeral-editor-root')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('funeral-editor-root')).toHaveAttribute('data-editor-shell', 'mobile');
  await expect(page.getByTestId('mobile-editor-layout')).toBeVisible();
  return created;
}

test.describe('Funeral editor mobile layout', () => {
  for (const width of [360, 390, 430] as const) {
    test(`Funeral KO ${width}: card in viewport, no body overflow`, async ({ browser }) => {
      const context = await browser.newContext({
        locale: 'ko-KR',
        viewport: { width, height: 844 },
      });
      const page = await context.newPage();
      await loginInBrowser(page, `e2e-funeral-layout-ko-${width}-${Date.now()}@example.com`);
      const created = await openFuneralEditor(page, 'ko-KR');
      try {
        await assertNoBodyOverflow(page);
        await assertCardInViewport(page, 12);
        await expect(page.getByTestId('mobile-editor-stepper')).toBeVisible();
        const stepper = page.getByTestId('unified-stepper-horizontal');
        await expect(stepper).toBeVisible();
        const stepperMetrics = await stepper.evaluate((el) => ({
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
        }));
        expect(stepperMetrics.clientWidth).toBeLessThanOrEqual(width + 1);
        await expect(page.getByRole('button', { name: /미리보기|Preview/i })).toBeVisible();
      } finally {
        await cleanupInvitation(page, created.id);
        await context.close();
      }
    });
  }

  test('Funeral EN 390: long labels stay inside card', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await loginInBrowser(page, `e2e-funeral-layout-en-${Date.now()}@example.com`);
    const created = await openFuneralEditor(page, 'en-US');
    try {
      await expect(page.getByTestId('funeral-editor-root')).toContainText(/Basic Info|Date of Passing/i);
      await assertNoBodyOverflow(page);
      await assertCardInViewport(page, 12);
    } finally {
      await cleanupInvitation(page, created.id);
      await context.close();
    }
  });

  test('Funeral KO 390: all visible steps keep card in viewport', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'ko-KR',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await loginInBrowser(page, `e2e-funeral-steps-${Date.now()}@example.com`);
    const created = await openFuneralEditor(page, 'ko-KR');
    try {
      const steps = page.getByTestId('unified-stepper-horizontal').locator('button');
      const count = await steps.count();
      expect(count).toBeGreaterThanOrEqual(8);
      for (let i = 0; i < count; i += 1) {
        await steps.nth(i).click();
        await page.waitForTimeout(150);
        await assertNoBodyOverflow(page);
        await assertCardInViewport(page, 12);
      }
    } finally {
      await cleanupInvitation(page, created.id);
      await context.close();
    }
  });

  test('Funeral desktop 1280 keeps preview column', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'ko-KR',
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await loginInBrowser(page, `e2e-funeral-desktop-${Date.now()}@example.com`);
    const created = await createFuneralDraft(page, 'ko-KR');
    try {
      await page.goto(`${FE}/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('funeral-editor-root')).toHaveAttribute('data-editor-shell', 'desktop');
      await expect(page.getByTestId('desktop-editor-layout')).toBeVisible();
      await expect(page.getByTestId('mobile-editor-layout')).toHaveCount(0);
    } finally {
      await cleanupInvitation(page, created.id);
      await context.close();
    }
  });

  for (const concept of [
    { name: 'Wedding', conceptType: 'WEDDING', testId: 'wedding-editor-root' },
    { name: 'General', conceptType: 'GENERAL', testId: 'wedding-editor-root' },
    { name: 'Organization', conceptType: 'ORGANIZATION', testId: 'wedding-editor-root' },
  ] as const) {
    test(`${concept.name} 390 regression: mobile shell unchanged`, async ({ browser }) => {
      const context = await browser.newContext({
        locale: 'ko-KR',
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await loginInBrowser(page, `e2e-${concept.name.toLowerCase()}-reg-${Date.now()}@example.com`);
      const create = await page.request.post(`${API}/api/invitations`, {
        data: { templateKey: 'invitation_full', conceptType: concept.conceptType, locale: 'ko-KR' },
      });
      expect(create.ok(), await create.text()).toBeTruthy();
      const created = (await create.json()) as { id: string };
      try {
        await page.goto(`${FE}/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
        await expect(page.getByTestId(concept.testId)).toBeVisible({ timeout: 60_000 });
        await expect(page.getByTestId('mobile-editor-layout')).toBeVisible();
        await assertNoBodyOverflow(page);
        const form = page.getByTestId('mobile-editor-form');
        await expect(form).toBeVisible();
        const box = await form.boundingBox();
        expect(box).toBeTruthy();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1);
      } finally {
        await cleanupInvitation(page, created.id);
        await context.close();
      }
    });
  }
});
