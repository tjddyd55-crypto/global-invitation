/**
 * ORGANIZATION concept — selection + catalog smoke (development).
 */
import { expect, test } from '@playwright/test';

const FE = process.env.E2E_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const BE = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.describe('ORGANIZATION concept flow', () => {
  test.use({
    baseURL: FE,
    viewport: { width: 390, height: 844 },
  });

  test('public template preview renders ORGANIZATION_01_OFFICIAL with sample logo', async ({
    page,
  }) => {
    const logoResponses: number[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/ORGANIZATION_01_OFFICIAL/logo.webp')) {
        logoResponses.push(response.status());
      }
    });

    await page.goto('/templates/ORGANIZATION_01_OFFICIAL/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const doc = page.getByTestId('public-invitation-document');
    await expect(doc).toBeVisible({ timeout: 60_000 });
    await expect(doc).toHaveAttribute('data-visual-template', 'ORGANIZATION_01_OFFICIAL');
    await expect(doc).toHaveAttribute('data-concept', 'ORGANIZATION');
    await expect(page.getByText('2026 회장단 이·취임식').first()).toBeVisible();
    await expect(page.getByText('서울광진청년회의소').first()).toBeVisible();
    await expect(page.getByText('JCI Seoul Gwangjin').first()).toBeVisible();
    await expect(page.getByText('Junior Chamber International Seoul Gwangjin').first()).toBeVisible();

    const brandLogo = page.getByTestId('organization-brand-logo').first();
    await expect(brandLogo).toBeVisible();
    const logoImg = brandLogo.locator('img');
    await expect(logoImg).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(async () => logoImg.evaluate((el: HTMLImageElement) => el.naturalWidth), {
        timeout: 30_000,
      })
      .toBeGreaterThan(0);
    await expect
      .poll(async () => logoImg.evaluate((el: HTMLImageElement) => el.naturalHeight), {
        timeout: 30_000,
      })
      .toBeGreaterThan(0);
    expect(logoResponses.some((status) => status === 200)).toBeTruthy();
    await expect(page.getByTestId('preview-create-cta')).toBeVisible();
  });

  test('organization preview logo fits at 360 without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/templates/ORGANIZATION_01_OFFICIAL/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });
    expect(overflow).toBeFalsy();
    const logoBox = await page.getByTestId('organization-brand-logo').first().boundingBox();
    expect(logoBox).toBeTruthy();
    expect((logoBox?.x ?? 0) + (logoBox?.width ?? 0)).toBeLessThanOrEqual(360 + 1);
  });

  test('wedding preview regression still renders garden sample', async ({ page }) => {
    await page.goto('/templates/WEDDING_05_GARDEN/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('visual-template-preview')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('김민준').first()).toBeVisible();
  });

  test('organization preview exposes JCI sample music control without autoplay', async ({
    page,
    request,
  }) => {
    const sampleMusicUrl =
      'https://cdn.platform-assets.com/invitation/shared/music/general/7915ed06-84da-4a1d-aee9-3bae103fccf7.mp3';

    await page.goto('/templates/ORGANIZATION_01_OFFICIAL/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const player = page.getByTestId('invitation-music-player');
    await expect(player).toBeVisible({ timeout: 60_000 });
    // 사용자 제스처 없이 audible autoplay 금지 — 초기 idle 유지
    await expect(player).toHaveAttribute('data-music-status', 'idle');
    await expect(player).toHaveAttribute('aria-label', '배경 음악 재생');

    const head = await request.fetch(sampleMusicUrl, {
      method: 'HEAD',
      timeout: 30_000,
    });
    expect(head.status()).toBe(200);
    expect(head.headers()['content-type'] || '').toMatch(/audio\/mpeg/i);
  });

  test('create API accepts ORGANIZATION concept without sample logo persistence', async ({
    request,
  }) => {
    const login = await request.post(`${BE}/api/test-login`, {
      data: { email: 'org-e2e@example.com' },
    });
    expect(login.ok()).toBeTruthy();

    const create = await request.post(`${BE}/api/invitations`, {
      data: {
        templateKey: 'invitation_full',
        conceptType: 'ORGANIZATION',
        visualTemplateId: 'ORGANIZATION_01_OFFICIAL',
      },
    });
    expect(create.ok()).toBeTruthy();
    const body = await create.json();
    const invitation = body?.invitation || body;
    expect(invitation?.id).toBeTruthy();
    const dataJson = invitation?.dataJson || invitation?.data || {};
    const logo = dataJson?.organization?.logo;
    expect(logo == null || logo === '').toBeTruthy();
    const music = dataJson?.music;
    expect(
      !music ||
        music.enabled !== true ||
        (!music.fileUrl && !music.trackId && !music.musicKey)
    ).toBeTruthy();
  });

  test('organization editor shows logo guidance and authenticated music library', async ({
    browser,
  }) => {
    test.setTimeout(300_000);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const email = `org-music-logo-${Date.now()}@example.com`;

    const login = await page.request.post(`${BE}/api/test-login`, { data: { email } });
    expect(login.ok()).toBeTruthy();
    const loginBody = await login.json();
    const cookies = await page.context().cookies(BE);
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

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.evaluate(
      ({ token, userId, userEmail }) => {
        window.localStorage.setItem(
          'auth_session_v1',
          JSON.stringify({
            token,
            user: { id: userId, email: userEmail, role: 'USER' },
          })
        );
      },
      { token: auth!.value, userId: loginBody.userId as string, userEmail: email }
    );

    const created = await page.evaluate(async ({ api }) => {
      const res = await fetch(`${api}/api/invitations`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${window.localStorage.getItem('auth_session_v1') ? JSON.parse(window.localStorage.getItem('auth_session_v1')!).token : ''}`,
        },
        body: JSON.stringify({
          templateKey: 'invitation_full',
          conceptType: 'ORGANIZATION',
          visualTemplateId: 'ORGANIZATION_01_OFFICIAL',
        }),
      });
      const body = await res.json();
      const invitation = body?.invitation || body;
      return { ok: res.ok, id: invitation?.id as string };
    }, { api: BE });
    expect(created.ok).toBeTruthy();
    expect(created.id).toBeTruthy();

    await page.goto(`/editor/${created.id}?concept=ORGANIZATION`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });

    const branding = page.getByTestId('step-organization-branding');
    await expect(branding).toBeVisible({ timeout: 60_000 });
    const guidance = page.getByTestId('organization-logo-upload-guidance');
    await expect(guidance).toBeVisible();
    await expect(guidance).toContainText('1200px');
    await expect(guidance).toContainText('PNG');
    await expect(guidance).toContainText('JPG');
    await expect(guidance).toContainText('WebP');
    await expect(guidance).toContainText('10MB');
    await expect(guidance).not.toContainText('정사각');

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });
    expect(overflow).toBeFalsy();

    // Music step — ORGANIZATION stepper index may differ; open by label.
    const musicStepNav = page.getByRole('button', { name: /음악 설정/ }).first();
    if (await musicStepNav.isVisible().catch(() => false)) {
      await musicStepNav.click();
    } else {
      await page.getByTestId(/stepper-item-/).filter({ hasText: '음악 설정' }).click();
    }

    await expect(page.getByTestId('editor-music-step')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('editor-music-enabled-toggle').click();
    await expect(page.getByText('AUTH_REQUIRED')).toHaveCount(0);
    await expect(page.getByText('JCI Creed Song', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('JCI Creed Song 2', { exact: true })).toBeVisible();

    await context.close();
  });
});
