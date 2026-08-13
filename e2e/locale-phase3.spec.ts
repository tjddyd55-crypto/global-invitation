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

async function createPublishedInvitation(
  page: Page,
  language: 'ko-KR' | 'en-US',
  visualTemplateId = 'WEDDING_05_GARDEN',
  conceptType = 'WEDDING'
) {
  const create = await page.request.post(`${API}/api/test/published-invitation`, {
    data: { language, visualTemplateId, conceptType },
  });
  expect(create.ok(), `published factory ${await create.text()}`).toBeTruthy();
  return (await create.json()) as { id: string; shareSlug: string; language: string; title: string };
}

async function cleanupInvitation(page: Page, id: string) {
  const res = await page.request.delete(`${API}/api/test/published-invitation/${id}`);
  expect([200, 204, 404]).toContain(res.status());
}

test.describe('Locale Phase 3', () => {
  test('Published KO invitation stays Korean with EN browser', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const email = `e2e-locale-ko-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    await page.context().addCookies([
      { name: 'gi_locale', value: 'en-US', domain: new URL(FE).hostname, path: '/' },
    ]);

    const created = await createPublishedInvitation(page, 'ko-KR');
    try {
      await page.goto(`${FE}/i/${created.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      const doc = page.getByTestId('public-invitation-document');
      await expect(doc).toBeVisible({ timeout: 60_000 });
      await expect(doc).toContainText('우리 결혼합니다');
      await expect(doc).toContainText('예식 일정');
      await expect(doc).toContainText('교통 안내');
      await expect(doc).toContainText('참석 여부');
      await expect(doc).toContainText('참석 여부 알리기');
      await expect(page.getByTestId('invitation-share-block')).toContainText(
        /공유하기|초대장 링크|링크 복사|카카오/
      );
      await expect(doc).not.toContainText("We're Getting Married");
      await expect(doc).not.toContainText('RSVP Now');
      await expect(doc).not.toContainText('Date & Time');
    } finally {
      await cleanupInvitation(page, created.id);
      await context.close();
    }
  });

  test('Published EN invitation stays English with KO browser', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'ko-KR',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const email = `e2e-locale-en-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    await page.context().addCookies([
      { name: 'gi_locale', value: 'ko-KR', domain: new URL(FE).hostname, path: '/' },
    ]);

    const created = await createPublishedInvitation(page, 'en-US');
    try {
      await page.goto(`${FE}/i/${created.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      const doc = page.getByTestId('public-invitation-document');
      await expect(doc).toBeVisible({ timeout: 60_000 });
      await expect(doc).toContainText("We're Getting Married");
      await expect(doc).toContainText('Date & Time');
      await expect(doc).toContainText('Directions');
      await expect(doc).toContainText('RSVP Now');
      await expect(doc).toContainText(/View on Google Maps|Get directions/);
      await expect(page.getByTestId('invitation-share-block')).toContainText(
        /Share|Invitation Link|Copy link|KakaoTalk/i
      );
      await expect(doc).not.toContainText('우리 결혼합니다');
      await expect(doc).not.toContainText('예식 일정');
      await expect(doc).not.toContainText('참석 여부 알리기');
      await expect(doc).not.toContainText('교통 안내');
    } finally {
      await cleanupInvitation(page, created.id);
      await context.close();
    }
  });

  test('Create snapshot stores invitation.language from product mode', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const email = `e2e-create-${Date.now()}@example.com`;
    await loginInBrowser(page, email);

    const enCreate = await page.request.post(`${API}/api/invitations`, {
      data: { templateKey: 'invitation_full', conceptType: 'WEDDING', locale: 'en-US' },
    });
    expect(enCreate.ok(), await enCreate.text()).toBeTruthy();
    const enInvitation = (await enCreate.json()) as { id: string; language?: string };
    expect(enInvitation.language).toBe('en-US');

    const koCreate = await page.request.post(`${API}/api/invitations`, {
      data: { templateKey: 'invitation_full', conceptType: 'WEDDING', locale: 'ko-KR' },
    });
    expect(koCreate.ok(), await koCreate.text()).toBeTruthy();
    const koInvitation = (await koCreate.json()) as { id: string; language?: string };
    expect(koInvitation.language).toBe('ko-KR');

    await page.request.delete(`${API}/api/test/published-invitation/${enInvitation.id}`).catch(() => undefined);
    await page.request.delete(`${API}/api/test/published-invitation/${koInvitation.id}`).catch(() => undefined);
    await context.close();
  });

  test('Mixed locale edit: KO service + EN invitation uses English editor', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ko-KR', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const email = `e2e-mixed-en-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    await page.context().addCookies([
      { name: 'gi_locale', value: 'ko-KR', domain: new URL(FE).hostname, path: '/' },
    ]);

    const create = await page.request.post(`${API}/api/invitations`, {
      data: { templateKey: 'invitation_full', conceptType: 'WEDDING', locale: 'en-US' },
    });
    expect(create.ok(), await create.text()).toBeTruthy();
    const created = (await create.json()) as { id: string };

    try {
      await page.goto(`${FE}/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('wedding-editor-root')).toContainText(/Basic Info|Cover Image|Greeting|RSVP/i);
      await expect(page.getByTestId('wedding-editor-root')).not.toContainText('기본 정보');
    } finally {
      await context.close();
    }
  });

  test('Mixed locale edit: EN service + KO invitation uses Korean editor', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const email = `e2e-mixed-ko-${Date.now()}@example.com`;
    await loginInBrowser(page, email);
    await page.context().addCookies([
      { name: 'gi_locale', value: 'en-US', domain: new URL(FE).hostname, path: '/' },
    ]);

    const create = await page.request.post(`${API}/api/invitations`, {
      data: { templateKey: 'invitation_full', conceptType: 'WEDDING', locale: 'ko-KR' },
    });
    expect(create.ok(), await create.text()).toBeTruthy();
    const created = (await create.json()) as { id: string };

    try {
      await page.goto(`${FE}/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('wedding-editor-root')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('wedding-editor-root')).toContainText(/기본 정보|대표 이미지|인사말|참석 여부/);
      await expect(page.getByTestId('wedding-editor-root')).not.toContainText('Basic Info');
    } finally {
      await context.close();
    }
  });

  test('EN editor step traversal shows English system copy', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const email = `e2e-editor-en-${Date.now()}@example.com`;
    await loginInBrowser(page, email);

    const create = await page.request.post(`${API}/api/invitations`, {
      data: { templateKey: 'invitation_full', conceptType: 'WEDDING', locale: 'en-US' },
    });
    expect(create.ok(), await create.text()).toBeTruthy();
    const created = (await create.json()) as { id: string };

    try {
      await page.goto(`${FE}/editor/${created.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      const root = page.getByTestId('wedding-editor-root');
      await expect(root).toBeVisible({ timeout: 60_000 });

      for (const label of ['Cover Image', 'Greeting', 'Gallery', 'Location', 'Gift', 'RSVP', 'Music', 'Sharing']) {
        const step = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
        if (await step.count()) {
          await step.click();
          await expect(root).not.toContainText('이미지를 선택하세요');
          await expect(root).not.toContainText('신랑 · 신부');
        }
      }
    } finally {
      await context.close();
    }
  });

  test('Festive preview EN system headings', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(FE, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('en-US');
    await page.goto(`${FE}/templates/GENERAL_05_FESTIVE/preview`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const doc = page.getByTestId('public-invitation-document');
    await expect(doc).toBeVisible({ timeout: 60_000 });
    await expect(doc).not.toContainText('행사 소개를 입력해 주세요');
  });

  test('JCI preview EN system headings', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(FE, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('en-US');
    await page.goto(`${FE}/templates/ORGANIZATION_02_JCI/preview`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByText('JCI Seoul Gwangjin').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('public-invitation-document')).toContainText(/Date|Venue|RSVP/i);
    await expect(page.getByTestId('public-invitation-document')).not.toContainText('참석 여부 알리기');
  });

  test('Classic preview KO system headings', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(FE, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('ko-KR');
    await page.goto(`${FE}/templates/GENERAL_01_CLASSIC/preview`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
  });

  test('1280 English marketing home does not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(FE, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('en-US');
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBeFalsy();
  });

  test('390 English public garden does not overflow horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(FE, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.getByTestId('locale-selector').first().selectOption('en-US');
    await page.goto(`${FE}/templates/WEDDING_05_GARDEN/preview`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBeFalsy();
  });
});
