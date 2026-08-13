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
  const factory = await page.request.delete(`${API}/api/test/published-invitation/${id}`);
  if ([200, 204, 404].includes(factory.status())) return;
  // Drafts created via /api/invitations are not factory rows (403). Use owner delete.
  if (factory.status() === 403) {
    const owner = await page.request.delete(`${API}/api/invitations/${id}`);
    expect([200, 204, 404], await owner.text()).toContain(owner.status());
    return;
  }
  expect([200, 204, 404], await factory.text()).toContain(factory.status());
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
      await cleanupInvitation(page, created.id);
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
      await cleanupInvitation(page, created.id);
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
      await cleanupInvitation(page, created.id);
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

  test('Comments public follow invitation locale, not browser locale', async ({ browser }) => {
    const koContext = await browser.newContext({ locale: 'en-US', viewport: { width: 390, height: 844 } });
    const koPage = await koContext.newPage();
    await loginInBrowser(koPage, `e2e-comments-ko-${Date.now()}@example.com`);
    await koPage.context().addCookies([
      { name: 'gi_locale', value: 'en-US', domain: new URL(FE).hostname, path: '/' },
    ]);
    const koCreated = await createPublishedInvitation(koPage, 'ko-KR', 'WEDDING_01_CLASSIC');
    try {
      await koPage.goto(`${FE}/i/${koCreated.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      const comments = koPage.getByTestId('invitation-comments-section');
      await expect(comments).toBeVisible({ timeout: 60_000 });
      await expect(comments).toContainText(/축하 메시지|메시지를 남겨주세요|작성하기/);
      await expect(comments).not.toContainText('Congratulations');
      await expect(comments).not.toContainText('Write a message');
    } finally {
      await cleanupInvitation(koPage, koCreated.id);
      await koContext.close();
    }

    const enContext = await browser.newContext({ locale: 'ko-KR', viewport: { width: 390, height: 844 } });
    const enPage = await enContext.newPage();
    await loginInBrowser(enPage, `e2e-comments-en-${Date.now()}@example.com`);
    await enPage.context().addCookies([
      { name: 'gi_locale', value: 'ko-KR', domain: new URL(FE).hostname, path: '/' },
    ]);
    const enCreated = await createPublishedInvitation(enPage, 'en-US', 'WEDDING_01_CLASSIC');
    try {
      await enPage.goto(`${FE}/i/${enCreated.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      const comments = enPage.getByTestId('invitation-comments-section');
      await expect(comments).toBeVisible({ timeout: 60_000 });
      await expect(comments).toContainText(/Congratulations|Messages|Write a message/i);
      await expect(comments).not.toContainText('축하 메시지');
      await expect(comments).not.toContainText('작성하기');
    } finally {
      await cleanupInvitation(enPage, enCreated.id);
      await enContext.close();
    }
  });

  test('Comments admin follows service locale, not invitation locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await loginInBrowser(page, `e2e-comments-admin-${Date.now()}@example.com`);
    await page.context().addCookies([
      { name: 'gi_locale', value: 'en-US', domain: new URL(FE).hostname, path: '/' },
    ]);
    const created = await createPublishedInvitation(page, 'ko-KR', 'WEDDING_01_CLASSIC');
    try {
      await page.goto(`${FE}/my-invitations/${created.id}/comments`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      });
      const screen = page.getByTestId('comments-admin-screen');
      await expect(screen).toBeVisible({ timeout: 60_000 });
      await expect(screen).toContainText(/Comment Management|No comments yet|Comments/i);
      await expect(screen).not.toContainText('댓글 관리');
    } finally {
      await cleanupInvitation(page, created.id);
      await context.close();
    }

    const koContext = await browser.newContext({ locale: 'ko-KR', viewport: { width: 1280, height: 800 } });
    const koPage = await koContext.newPage();
    await loginInBrowser(koPage, `e2e-comments-admin-ko-${Date.now()}@example.com`);
    await koPage.context().addCookies([
      { name: 'gi_locale', value: 'ko-KR', domain: new URL(FE).hostname, path: '/' },
    ]);
    const koCreated = await createPublishedInvitation(koPage, 'en-US', 'WEDDING_01_CLASSIC');
    try {
      await koPage.goto(`${FE}/my-invitations/${koCreated.id}/comments`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      });
      const screen = koPage.getByTestId('comments-admin-screen');
      await expect(screen).toBeVisible({ timeout: 60_000 });
      await expect(screen).toContainText(/댓글 관리|등록된 댓글이 없습니다/);
      await expect(screen).not.toContainText('Comment Management');
    } finally {
      await cleanupInvitation(koPage, koCreated.id);
      await koContext.close();
    }
  });

  test('RSVP public form follows invitation locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ko-KR', viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await loginInBrowser(page, `e2e-rsvp-public-${Date.now()}@example.com`);
    await page.context().addCookies([
      { name: 'gi_locale', value: 'ko-KR', domain: new URL(FE).hostname, path: '/' },
    ]);
    const created = await createPublishedInvitation(page, 'en-US');
    try {
      await page.goto(`${FE}/i/${created.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await expect(page.getByTestId('invitation-rsvp-section')).toBeVisible({ timeout: 60_000 });
      await page.getByTestId('invitation-rsvp-cta').click();
      const form = page.getByTestId('rsvp-form');
      await expect(form).toBeVisible({ timeout: 30_000 });
      await expect(form).toContainText(/Name|Attendance|Party size|Submit/i);
      await expect(form).not.toContainText('참석 인원');
      await expect(form).not.toContainText('응답 제출');
    } finally {
      await cleanupInvitation(page, created.id);
      await context.close();
    }
  });

  test('RSVP admin follows service locale, not invitation locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await loginInBrowser(page, `e2e-rsvp-admin-${Date.now()}@example.com`);
    await page.context().addCookies([
      { name: 'gi_locale', value: 'en-US', domain: new URL(FE).hostname, path: '/' },
    ]);
    const created = await createPublishedInvitation(page, 'ko-KR');
    try {
      await page.goto(`${FE}/my-invitations/${created.id}/rsvp`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      });
      const screen = page.getByTestId('rsvp-admin-screen');
      await expect(screen).toBeVisible({ timeout: 60_000 });
      await expect(screen).toContainText(/RSVP Management|No responses yet|Attending/i);
      await expect(screen).not.toContainText('참석 응답 관리');
      await expect(screen).not.toContainText('아직 응답이 없습니다');
    } finally {
      await cleanupInvitation(page, created.id);
      await context.close();
    }

    const koContext = await browser.newContext({ locale: 'ko-KR', viewport: { width: 1280, height: 800 } });
    const koPage = await koContext.newPage();
    await loginInBrowser(koPage, `e2e-rsvp-admin-ko-${Date.now()}@example.com`);
    await koPage.context().addCookies([
      { name: 'gi_locale', value: 'ko-KR', domain: new URL(FE).hostname, path: '/' },
    ]);
    const koCreated = await createPublishedInvitation(koPage, 'en-US');
    try {
      await koPage.goto(`${FE}/my-invitations/${koCreated.id}/rsvp`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      });
      const screen = koPage.getByTestId('rsvp-admin-screen');
      await expect(screen).toBeVisible({ timeout: 60_000 });
      await expect(screen).toContainText(/RSVP 관리|참석 응답 관리|아직 응답이 없습니다/);
      await expect(screen).not.toContainText('RSVP Management');
    } finally {
      await cleanupInvitation(koPage, koCreated.id);
      await koContext.close();
    }
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
