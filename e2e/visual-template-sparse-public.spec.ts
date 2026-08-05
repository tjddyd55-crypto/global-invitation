/**
 * sparse Public dataJson regression — fixture 병합 없이 renderer 진입.
 */
import { test, expect } from '@playwright/test';
import {
  API,
  FE,
  assertNoBrokenImages,
  assertNoIsoOrFixtureLeak,
  createPublishInvitation,
  loginInBrowser,
  writeJsonArtifact,
} from './helpers/visualTemplateAcceptance';

test.setTimeout(420_000);

const CASES = [
  {
    name: 'sparse WEDDING with templateType',
    conceptType: 'WEDDING' as const,
    visualTemplateId: 'WEDDING_04_EDITORIAL',
    data: {
      templateType: 'FULL',
      conceptType: 'WEDDING',
      visualTemplateId: 'WEDDING_04_EDITORIAL',
      title: '희박웨딩타이틀',
    },
    expectTemplate: 'WEDDING_04_EDITORIAL',
  },
  {
    name: 'sparse GENERAL without templateType',
    conceptType: 'GENERAL' as const,
    visualTemplateId: 'GENERAL_04_CLEAN',
    data: {
      conceptType: 'GENERAL',
      visualTemplateId: 'GENERAL_04_CLEAN',
      title: '희박일반타이틀',
    },
    expectTemplate: 'GENERAL_04_CLEAN',
  },
  {
    name: 'title only WEDDING',
    conceptType: 'WEDDING' as const,
    visualTemplateId: 'WEDDING_05_GARDEN',
    data: {
      conceptType: 'WEDDING',
      visualTemplateId: 'WEDDING_05_GARDEN',
      title: '제목만존재',
    },
    expectTemplate: 'WEDDING_05_GARDEN',
  },
  {
    name: 'date only GENERAL',
    conceptType: 'GENERAL' as const,
    visualTemplateId: 'GENERAL_05_FESTIVE',
    data: {
      conceptType: 'GENERAL',
      visualTemplateId: 'GENERAL_05_FESTIVE',
      eventDate: '2026-09-01T10:00:00',
      title: '날짜행사',
    },
    expectTemplate: 'GENERAL_05_FESTIVE',
  },
  {
    name: 'no visualTemplateId → Classic fallback',
    conceptType: 'WEDDING' as const,
    data: {
      conceptType: 'WEDDING',
      title: '클래식폴백',
      eventDate: '2026-08-20T12:00:00',
    },
    expectTemplate: 'WEDDING_01_CLASSIC',
  },
  {
    name: 'no gallery/accounts/rsvp/music/map',
    conceptType: 'GENERAL' as const,
    visualTemplateId: 'GENERAL_06_CULTURE',
    data: {
      templateType: 'FULL',
      conceptType: 'GENERAL',
      visualTemplateId: 'GENERAL_06_CULTURE',
      title: '옵션없음',
      rsvpEnabled: false,
      galleryImages: [],
      accounts: [],
      music: { enabled: false },
    },
    expectTemplate: 'GENERAL_06_CULTURE',
  },
];

test('sparse public: renderer without fixture merge', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  await loginInBrowser(page, `sparse-${Date.now()}@example.com`);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded' });

  const report: Array<Record<string, unknown>> = [];

  for (const item of CASES) {
    const published = await createPublishInvitation(page.request, {
      conceptType: item.conceptType,
      visualTemplateId: item.visualTemplateId,
      title: typeof item.data.title === 'string' ? item.data.title : undefined,
      data: item.data,
    });

    const res = await page.goto(`${FE}/i/${published.shareSlug}`, {
      waitUntil: 'networkidle',
      timeout: 90_000,
    });
    expect(res?.ok(), item.name).toBeTruthy();
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('concept-render-error')).toHaveCount(0);
    await expect(page.getByText('초대장을 표시할 수 없습니다.')).toHaveCount(0);
    await expect(page.locator(`[data-visual-template="${item.expectTemplate}"]`).first()).toBeVisible();
    if (typeof item.data.title === 'string') {
      await expect(page.getByText(item.data.title).first()).toBeVisible();
    }
    await assertNoIsoOrFixtureLeak(page);
    await assertNoBrokenImages(page);
    // optional sections hidden or empty — no fixture names
    await expect(page.getByText('지수')).toHaveCount(0);
    await expect(page.getByText('민준')).toHaveCount(0);

    report.push({
      name: item.name,
      shareSlug: published.shareSlug,
      expectTemplate: item.expectTemplate,
      status: 'PASS',
    });
  }

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  writeJsonArtifact('artifacts/visual-template-acceptance/sparse-public.json', { report });
  await context.close();
});

test('sparse unit-ish: create without patch still renders', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await loginInBrowser(page, `sparse-nopatch-${Date.now()}@example.com`);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded' });

  const create = await page.request.post(`${API}/api/invitations`, {
    data: {
      templateKey: 'invitation_full',
      conceptType: 'WEDDING',
      visualTemplateId: 'WEDDING_06_NIGHT',
    },
  });
  expect(create.ok()).toBeTruthy();
  const created = (await create.json()) as { id: string };
  const publish = await page.request.post(`${API}/api/invitations/${created.id}/publish`);
  expect(publish.ok()).toBeTruthy();
  const published = (await publish.json()) as { shareSlug: string };

  await page.goto(`${FE}/i/${published.shareSlug}`, { waitUntil: 'networkidle' });
  await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-visual-template="WEDDING_06_NIGHT"]').first()).toBeVisible();
  await expect(page.getByText('초대장을 표시할 수 없습니다.')).toHaveCount(0);
  await context.close();
});
