/**
 * Public + reduced-motion smoke for visual templates (development).
 */
import { test, expect, type Page } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

const CASES = [
  { id: 'WEDDING_04_EDITORIAL', concept: 'WEDDING', label: '모던 에디토리얼' },
  { id: 'WEDDING_05_GARDEN', concept: 'WEDDING', label: '로맨틱 가든' },
  { id: 'WEDDING_06_NIGHT', concept: 'WEDDING', label: '미니멀 나이트' },
  { id: 'GENERAL_04_CLEAN', concept: 'GENERAL', label: '클린 이벤트' },
  { id: 'GENERAL_05_FESTIVE', concept: 'GENERAL', label: '페스티브 컬러' },
  { id: 'GENERAL_06_CULTURE', concept: 'GENERAL', label: '컬처 앤 엑시비션' },
] as const;

test.setTimeout(600_000);

async function loginInBrowser(page: Page, email: string) {
  const res = await page.request.post(`${API}/api/test-login`, { data: { email } });
  expect(res.ok(), await res.text()).toBeTruthy();
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

test('public: create publish visit 6 visual templates', async ({ browser }) => {
  const pageErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `handoff-public-${Date.now()}@example.com`;
  await loginInBrowser(page, email);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded', timeout: 90_000 });

  for (const item of CASES) {
    const create = await page.request.post(`${API}/api/invitations`, {
      data: {
        templateKey: 'invitation_full',
        conceptType: item.concept,
        visualTemplateId: item.id,
      },
    });
    expect(create.ok(), `${item.id} create ${await create.text()}`).toBeTruthy();
    const created = (await create.json()) as { id: string; shareSlug?: string; slug?: string };

    // Patch with unique title so Public is distinguishable from fixture names
    const title =
      item.concept === 'WEDDING' ? `핸드오프공개 · ${item.id.slice(-6)}` : `공개행사 · ${item.id.slice(-6)}`;
    const patch = await page.request.patch(`${API}/api/invitations/${created.id}`, {
      data: {
        data: {
          conceptType: item.concept,
          visualTemplateId: item.id,
          title,
          eventDate: '2026-11-20T15:00:00',
          locationText: '핸드오프 검증홀',
        },
      },
    });
    expect(patch.ok(), `${item.id} patch ${await patch.text()}`).toBeTruthy();

    const publish = await page.request.post(`${API}/api/invitations/${created.id}/publish`);
    expect(publish.ok(), `${item.id} publish ${await publish.text()}`).toBeTruthy();
    const published = (await publish.json()) as { shareSlug?: string; slug?: string };
    const shareSlug = published.shareSlug || created.shareSlug || created.slug;
    expect(shareSlug, item.id).toBeTruthy();

    const res = await page.goto(`${FE}/i/${shareSlug}`, {
      waitUntil: 'networkidle',
      timeout: 90_000,
    });
    expect(res?.ok(), item.id).toBeTruthy();
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(`[data-visual-template="${item.id}"]`).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(title).first()).toBeVisible();
    await expect(page.getByTestId('preview-create-cta')).toHaveCount(0);
    await expect(page.getByText('이 템플릿으로 초대장 만들기')).toHaveCount(0);
    await expect(page.getByText(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).toHaveCount(0);
    // fixture names must not leak
    await expect(page.getByText('지수 · 민준')).toHaveCount(0);
    await expect(page.getByText('창작의 리듬')).toHaveCount(0);

    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
        .map((img) => img.src)
    );
    expect(broken, `${item.id} broken\n${broken.join('\n')}`).toEqual([]);
  }

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  await context.close();
});

test('reduced-motion: editorial preview final state visible', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(`${FE}/templates/WEDDING_04_EDITORIAL/preview`, {
    waitUntil: 'networkidle',
    timeout: 90_000,
  });
  await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });

  const hidden = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.gi-reveal'));
    return nodes
      .map((node) => {
        const style = getComputedStyle(node);
        return {
          opacity: style.opacity,
          transform: style.transform,
        };
      })
      .filter((row) => row.opacity === '0' || (row.transform && row.transform !== 'none'));
  });
  expect(hidden, JSON.stringify(hidden)).toEqual([]);
  await context.close();
});
