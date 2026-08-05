/**
 * Editor template switch — protected-field deep-diff.
 * Baseline = first editor save (normalization 허용) 이후 템플릿 전환만 비교.
 */
import { test, expect } from '@playwright/test';
import {
  API,
  FE,
  buildRichGeneralData,
  buildRichWeddingData,
  createPublishInvitation,
  loginInBrowser,
  writeJsonArtifact,
} from './helpers/visualTemplateAcceptance';

test.setTimeout(600_000);

const PROTECTED_KEYS = [
  'title',
  'subtitle',
  'conceptType',
  'templateType',
  'venueName',
  'venueDetail',
  'address',
  'heroImage',
  'galleryImages',
  'galleryDisplayMode',
  'accounts',
  'rsvpEnabled',
  'mapLat',
  'mapLng',
  'mapProvider',
  'music',
  'groomName',
  'brideName',
  'introQuote',
  'content',
] as const;

function pickProtected(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of PROTECTED_KEYS) {
    if (key === 'music') {
      const music = (data.music || {}) as Record<string, unknown>;
      out.music = {
        enabled: Boolean(music.enabled),
        musicKey: music.musicKey || null,
        sourceType: music.sourceType || null,
      };
      continue;
    }
    if (key === 'galleryImages') {
      out.galleryImages = Array.isArray(data.galleryImages) ? data.galleryImages : [];
      out.galleryCount = Array.isArray(data.galleryImages) ? data.galleryImages.length : 0;
      continue;
    }
    if (key === 'accounts') {
      out.accounts = Array.isArray(data.accounts) ? data.accounts : [];
      out.accountCount = Array.isArray(data.accounts) ? data.accounts.length : 0;
      continue;
    }
    out[key] = data[key] ?? null;
  }
  return out;
}

function protectedDiff(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const left = pickProtected(before);
  const right = pickProtected(after);
  return Object.keys(left)
    .filter((key) => JSON.stringify(left[key]) !== JSON.stringify(right[key]))
    .sort();
}

async function fetchDataJson(request: import('@playwright/test').APIRequestContext, id: string) {
  const res = await request.get(`${API}/api/invitations/${id}`);
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { dataJson?: Record<string, unknown>; data?: Record<string, unknown> };
  return (body.dataJson || body.data || {}) as Record<string, unknown>;
}

async function switchTemplate(page: import('@playwright/test').Page, label: RegExp) {
  await page.getByRole('button', { name: '템플릿 변경' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: label }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: '템플릿 변경' }).click();
  const saveBtn = page.getByRole('button', { name: /저장/ }).first();
  if (await saveBtn.count()) {
    await saveBtn.click();
    await page.waitForTimeout(1500);
  }
}

async function openEditorAndBaseline(
  page: import('@playwright/test').Page,
  id: string,
  slug: string
) {
  await page.goto(`${FE}/editor/${slug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByTestId('editor-template-switcher')).toBeVisible({ timeout: 60_000 });
  const saveBtn = page.getByRole('button', { name: /저장/ }).first();
  await saveBtn.click();
  await page.waitForTimeout(1500);
  const baseline = await fetchDataJson(page.request, id);
  expect((baseline.galleryImages as unknown[])?.length ?? 0).toBeGreaterThanOrEqual(11);
  expect((baseline.accounts as unknown[])?.length ?? 0).toBeGreaterThanOrEqual(2);
  return baseline;
}

test('WEDDING deep-diff across Classic→Editorial→Garden→Night→Classic', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await loginInBrowser(page, `diff-w-${Date.now()}@example.com`);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded' });

  const title = `딥디프웨딩 ${Date.now().toString().slice(-5)}`;
  const seed = buildRichWeddingData('WEDDING_01_CLASSIC' as never, title);
  seed.visualTemplateId = 'WEDDING_01_CLASSIC';
  const created = await createPublishInvitation(page.request, {
    conceptType: 'WEDDING',
    visualTemplateId: 'WEDDING_01_CLASSIC',
    title,
    data: seed,
  });

  const detail = await page.request.get(`${API}/api/invitations/${created.id}`);
  const detailJson = (await detail.json()) as { slug: string };
  let previous = await openEditorAndBaseline(page, created.id, detailJson.slug);

  const sequence: Array<{ id: string; label: RegExp }> = [
    { id: 'WEDDING_04_EDITORIAL', label: /모던 에디토리얼/ },
    { id: 'WEDDING_05_GARDEN', label: /로맨틱 가든/ },
    { id: 'WEDDING_06_NIGHT', label: /미니멀 나이트/ },
    { id: 'WEDDING_01_CLASSIC', label: /^클래식/ },
  ];

  const diffs: Array<Record<string, unknown>> = [];
  for (const step of sequence) {
    await switchTemplate(page, step.label);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('editor-template-switcher')).toBeVisible({ timeout: 60_000 });
    const next = await fetchDataJson(page.request, created.id);
    expect(next.visualTemplateId).toBe(step.id);
    const changed = protectedDiff(previous, next);
    diffs.push({
      from: previous.visualTemplateId,
      to: step.id,
      changed,
      before: pickProtected(previous),
      after: pickProtected(next),
    });
    expect(changed, JSON.stringify(changed)).toEqual([]);
    previous = next;
  }

  await page.goto(`${FE}/i/${created.shareSlug}`, { waitUntil: 'networkidle' });
  await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-visual-template="WEDDING_01_CLASSIC"]').first()).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();

  writeJsonArtifact('artifacts/visual-template-acceptance/editor-deep-diff-wedding.json', { diffs });
  await context.close();
});

test('GENERAL deep-diff across Classic→Clean→Festive→Culture→Classic', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await loginInBrowser(page, `diff-g-${Date.now()}@example.com`);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded' });

  const title = `딥디프일반 ${Date.now().toString().slice(-5)}`;
  const seed = buildRichGeneralData('GENERAL_01_CLASSIC' as never, title);
  seed.visualTemplateId = 'GENERAL_01_CLASSIC';
  const created = await createPublishInvitation(page.request, {
    conceptType: 'GENERAL',
    visualTemplateId: 'GENERAL_01_CLASSIC',
    title,
    data: seed,
  });

  const detail = await page.request.get(`${API}/api/invitations/${created.id}`);
  const detailJson = (await detail.json()) as { slug: string };
  let previous = await openEditorAndBaseline(page, created.id, detailJson.slug);

  const sequence: Array<{ id: string; label: RegExp }> = [
    { id: 'GENERAL_04_CLEAN', label: /클린 이벤트/ },
    { id: 'GENERAL_05_FESTIVE', label: /페스티브 컬러/ },
    { id: 'GENERAL_06_CULTURE', label: /컬처 앤 엑시비션/ },
    { id: 'GENERAL_01_CLASSIC', label: /^클래식/ },
  ];

  const diffs: Array<Record<string, unknown>> = [];
  for (const step of sequence) {
    await switchTemplate(page, step.label);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const next = await fetchDataJson(page.request, created.id);
    expect(next.visualTemplateId).toBe(step.id);
    const changed = protectedDiff(previous, next);
    diffs.push({
      from: previous.visualTemplateId,
      to: step.id,
      changed,
      before: pickProtected(previous),
      after: pickProtected(next),
    });
    expect(changed, JSON.stringify(changed)).toEqual([]);
    previous = next;
  }

  await page.goto(`${FE}/i/${created.shareSlug}`, { waitUntil: 'networkidle' });
  await expect(page.locator('[data-visual-template="GENERAL_01_CLASSIC"]').first()).toBeVisible({
    timeout: 60_000,
  });

  writeJsonArtifact('artifacts/visual-template-acceptance/editor-deep-diff-general.json', { diffs });
  await context.close();
});
