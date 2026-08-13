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
      return { ok: res.ok, id: invitation?.id as string, data: invitation?.dataJson || invitation?.data };
    }, { api: BE });
    expect(created.ok).toBeTruthy();
    expect(created.id).toBeTruthy();
    expect(created.data?.organization?.logo == null || created.data?.organization?.logo === '').toBeTruthy();
    expect(created.data?.organization?.presetId == null || created.data?.organization?.presetId === 'CUSTOM').toBeTruthy();

    await page.goto(`/editor/${created.id}?concept=ORGANIZATION`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });

    await page.getByRole('button', { name: /기관 브랜딩/ }).first().click();
    const branding = page.getByTestId('step-organization-branding');
    await expect(branding).toBeVisible({ timeout: 60_000 });

    await expect(page.getByTestId('organization-preset-custom')).toBeVisible();
    await expect(page.getByTestId('organization-preset-jci')).toBeVisible();
    await expect(page.getByTestId('organization-preset-custom')).toHaveAttribute('aria-checked', 'true');

    const guidance = page.getByTestId('organization-logo-upload-guidance');
    await expect(guidance).toBeVisible();
    await expect(guidance).toContainText('투명 배경');
    await expect(guidance).not.toContainText('3:1');
    await expect(guidance).toContainText(/PNG|WEBP|WebP/i);

    await page.getByTestId('organization-preset-jci').click();
    await expect(page.getByTestId('organization-preset-jci')).toHaveAttribute('aria-checked', 'true', {
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="organization-logo-input"]').locator('..')).toBeVisible();

    await page.getByRole('button', { name: /음악 설정/ }).first().click();
    await expect(page.getByTestId('editor-music-step')).toBeVisible({ timeout: 30_000 });
    // Preset enables music — toggle may already be on
    const musicOn = page.getByTestId('editor-music-enabled-toggle-input');
    if (!(await musicOn.isChecked())) {
      await page.getByTestId('editor-music-enabled-toggle').click();
    }
    await expect(page.getByText('AUTH_REQUIRED')).toHaveCount(0);
    await expect(page.getByText('JCI Creed Song', { exact: true }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('JCI Creed Song 2', { exact: true })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });
    expect(overflow).toBeFalsy();

    await context.close();
  });

  test('template selector shows Official and JCI cards', async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const email = `org-catalog-${Date.now()}@example.com`;

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

    await page.goto('/create/templates?concept=ORGANIZATION', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByTestId('visual-template-catalog')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('공식', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('JCI', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('JCI 행사와 공식 초청에 맞춘 브랜드 템플릿').first()).toBeVisible();

    const officialCard = page.getByTestId('template-card-ORGANIZATION_01_OFFICIAL');
    const jciCard = page.getByTestId('template-card-ORGANIZATION_02_JCI');
    const officialSrc = await officialCard.locator('img').first().getAttribute('src');
    const jciSrc = await jciCard.locator('img').first().getAttribute('src');
    expect(officialSrc).toBeTruthy();
    expect(jciSrc).toBeTruthy();
    expect(officialSrc).not.toEqual(jciSrc);
    expect(jciSrc || '').toContain('ORGANIZATION_02_JCI/thumbnail');
    expect(officialSrc || '').not.toContain('ORGANIZATION_02_JCI/thumbnail');

    const [officialRes, jciRes] = await Promise.all([
      page.request.get(officialSrc as string),
      page.request.get(jciSrc as string),
    ]);
    expect(officialRes.ok()).toBeTruthy();
    expect(jciRes.ok()).toBeTruthy();

    await expect(page.getByTestId('template-preview-ORGANIZATION_01_OFFICIAL')).toHaveAttribute(
      'href',
      '/templates/ORGANIZATION_01_OFFICIAL/preview'
    );
    await expect(page.getByTestId('template-preview-ORGANIZATION_02_JCI')).toHaveAttribute(
      'href',
      '/templates/ORGANIZATION_02_JCI/preview'
    );

    for (const width of [360, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: width >= 1280 ? 800 : 844 });
      await expect(officialCard).toBeVisible();
      await expect(jciCard).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflow, `horizontal overflow at ${width}`).toBeFalsy();
    }

    await context.close();
  });

  test('public template preview renders ORGANIZATION_02_JCI', async ({ page }) => {
    await page.goto('/templates/ORGANIZATION_02_JCI/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const doc = page.getByTestId('public-invitation-document');
    await expect(doc).toBeVisible({ timeout: 60_000 });
    await expect(doc).toHaveAttribute('data-visual-template', 'ORGANIZATION_02_JCI');
    await expect(page.getByText('서울광진청년회의소').first()).toBeVisible();
    await expect(page.getByTestId('organization-brand-logo').first()).toBeVisible();
  });

  test('JCI preview actions use brand colors; Official RSVP stays purple', async ({ page }) => {
    await page.goto('/templates/ORGANIZATION_02_JCI/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const doc = page.getByTestId('public-invitation-document');
    await expect(doc).toBeVisible({ timeout: 60_000 });

    const rsvp = page.getByTestId('invitation-rsvp-cta');
    await expect(rsvp).toBeVisible();
    await expect
      .poll(async () => rsvp.evaluate((el) => getComputedStyle(el).backgroundColor), {
        timeout: 15_000,
      })
      .toBe('rgb(0, 151, 215)');

    const copy = page.getByTestId('account-copy').first();
    await expect(copy).toBeVisible();
    const copyBorder = await copy.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(copyBorder).toBe('rgb(0, 151, 215)');

    const mapLink = page.locator('[data-testid="google-maps-external-links"] a').first();
    await expect(mapLink).toBeVisible();
    const mapColor = await mapLink.evaluate((el) => getComputedStyle(el).color);
    expect(mapColor).not.toMatch(/79,\s*70,\s*229|91,\s*79,\s*214/);

    const footer = page.getByTestId('organization-jci-footer');
    await expect(footer).toBeVisible();
    await expect
      .poll(async () => footer.evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe('rgb(19, 15, 45)');

    const headerLogo = doc.getByTestId('organization-brand-logo').first();
    const headerSrc = await headerLogo.locator('img').getAttribute('src');
    expect(headerSrc || '').toContain('ORGANIZATION_01_OFFICIAL/logo.webp');
    expect(headerSrc || '').not.toContain('logo-on-dark.webp');

    const footerLogo = footer.getByTestId('organization-brand-logo');
    await expect(footerLogo).toBeVisible();
    await expect(footerLogo).toHaveAttribute('data-on-dark', 'true');
    const footerImg = footerLogo.locator('img');
    await expect(footerImg).toBeVisible();
    await expect
      .poll(async () => footerImg.evaluate((el: HTMLImageElement) => el.naturalWidth), {
        timeout: 30_000,
      })
      .toBeGreaterThan(0);
    const footerSrc = await footerImg.getAttribute('src');
    expect(footerSrc || '').toContain('logo-on-dark.webp');
    const footerImgFilter = await footerImg.evaluate((el) => getComputedStyle(el).filter);
    expect(footerImgFilter === 'none' || footerImgFilter === '').toBeTruthy();
    const footerLogoBg = await footerLogo.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(footerLogoBg === 'rgba(0, 0, 0, 0)' || footerLogoBg === 'transparent').toBeTruthy();

    const music = page.getByTestId('invitation-music-player');
    if (await music.isVisible()) {
      const musicBg = await music.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(musicBg).not.toMatch(/79,\s*70,\s*229|91,\s*79,\s*214/);
    }

    await page.goto('/templates/ORGANIZATION_01_OFFICIAL/preview', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    const officialCta = page.getByTestId('invitation-rsvp-cta');
    await expect(officialCta).toBeVisible({ timeout: 60_000 });
    await expect
      .poll(async () => officialCta.evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe('rgb(79, 70, 229)');
  });

  test('JCI create API applies preset assets without sample names', async ({ request }) => {
    const login = await request.post(`${BE}/api/test-login`, {
      data: { email: `org-jci-create-${Date.now()}@example.com` },
    });
    expect(login.ok()).toBeTruthy();

    const createPayload = {
      templateKey: 'invitation_full',
      conceptType: 'ORGANIZATION',
      visualTemplateId: 'ORGANIZATION_02_JCI',
      data: {
        conceptType: 'ORGANIZATION',
        visualTemplateId: 'ORGANIZATION_02_JCI',
        templateType: 'FULL',
        organization: {
          presetId: 'JCI',
          name: '',
          englishName: '',
          logo: 'invitation/shared/images/templates/ORGANIZATION_01_OFFICIAL/logo.webp',
          accentColor: '#0097D7',
        },
        music: {
          enabled: true,
          sourceType: 'SHARED',
          trackId: '7e718468-fe68-4903-8cda-3a7ab613483b',
          fileUrl:
            'invitation/shared/music/general/7915ed06-84da-4a1d-aee9-3bae103fccf7.mp3',
          title: 'JCI Creed Song',
          loop: true,
        },
      },
    };

    const create = await request.post(`${BE}/api/invitations`, { data: createPayload });
    expect(create.ok()).toBeTruthy();
    const body = await create.json();
    const invitation = body?.invitation || body;
    const dataJson = invitation?.dataJson || invitation?.data || {};
    expect(dataJson.visualTemplateId).toBe('ORGANIZATION_02_JCI');
    expect(dataJson.organization?.presetId).toBe('JCI');
    expect(dataJson.organization?.logo).toContain('ORGANIZATION_01_OFFICIAL/logo.webp');
    expect(dataJson.organization?.name === '' || dataJson.organization?.name == null).toBeTruthy();
    expect(String(dataJson.organization?.name || '')).not.toContain('서울광진');
    expect(dataJson.music?.enabled).toBe(true);
    expect(dataJson.music?.title).toBe('JCI Creed Song');
  });
});
