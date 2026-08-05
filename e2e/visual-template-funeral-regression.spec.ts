/**
 * FUNERAL browser regression — Editor / Preview / Public.
 */
import { test, expect } from '@playwright/test';
import {
  API,
  FE,
  assertNoBrokenImages,
  createPublishInvitation,
  loginInBrowser,
  writeJsonArtifact,
} from './helpers/visualTemplateAcceptance';

test.setTimeout(420_000);

const FUNERAL_DATA = {
  templateType: 'FULL',
  conceptType: 'FUNERAL',
  templateKey: 'funeral_classic',
  deceasedName: '수락고인',
  deathDate: '2026-10-01',
  chiefMourner: '수락상주',
  familyMembers: ['아들 수락일', '딸 수락이'],
  message: '삼가 고인의 명복을 빕니다.',
  funeralHall: {
    name: '수락장례식장',
    address: '서울특별시 송파구 올림픽로 300',
    mapLat: 37.5145,
    mapLng: 127.106,
  },
  schedule: {
    wakeStart: '2026-10-02T18:00:00',
    funeralDate: '2026-10-04T09:00:00',
    burial: '수락공원묘원',
  },
  contact: { name: '수락상주', phone: '010-1111-2222' },
};

test('FUNERAL editor preview public browser regression', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await loginInBrowser(page, `funeral-${Date.now()}@example.com`);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded' });

  const create = await page.request.post(`${API}/api/invitations`, {
    data: { templateKey: 'funeral_classic', conceptType: 'FUNERAL' },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const created = (await create.json()) as {
    id: string;
    slug: string;
    dataJson?: Record<string, unknown>;
  };

  // no visualTemplateId auto-insert
  expect(created.dataJson?.visualTemplateId).toBeUndefined();

  const patch = await page.request.patch(`${API}/api/invitations/${created.id}`, {
    data: { data: FUNERAL_DATA, title: '수락고인 추모' },
  });
  expect(patch.ok(), await patch.text()).toBeTruthy();
  const patched = (await patch.json()) as { dataJson?: Record<string, unknown>; data?: Record<string, unknown> };
  const payload = patched.dataJson || patched.data || {};
  expect(payload.visualTemplateId).toBeUndefined();
  expect(payload.conceptType).toBe('FUNERAL');

  // Editor
  await page.goto(`${FE}/editor/${created.slug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByRole('button', { name: '저장' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('textbox', { name: '고인명' })).toHaveValue('수락고인');
  await expect(page.getByTestId('editor-template-switcher')).toHaveCount(0);
  await expect(page.locator('[data-visual-template]')).toHaveCount(0);

  // Walk key steps
  await page.getByRole('button', { name: '장례 일정' }).click();
  await expect(page.getByRole('heading', { name: /장례 일정|일정/ })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: '위치 안내' }).click();
  await expect(page.getByRole('heading', { name: '위치 안내' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('textbox', { name: /장례식장|장소|이름/ }).first()).toBeVisible();
  await page.getByRole('button', { name: '계좌 정보' }).click();
  await expect(page.getByRole('heading', { name: '계좌 정보' })).toBeVisible({ timeout: 15_000 });

  // Save
  await page.getByRole('button', { name: '저장' }).click();
  await page.waitForTimeout(800);

  // Preview overlay
  await page.getByRole('button', { name: 'Preview' }).click();
  await page.waitForTimeout(800);
  await expect(page.locator('[data-visual-template]')).toHaveCount(0);
  // close preview if dialog/overlay
  const closePreview = page.getByRole('button', { name: /닫기|Close|에디터로/ }).first();
  if (await closePreview.count()) {
    await closePreview.click().catch(() => undefined);
  }

  // Publish + Public
  const publish = await page.request.post(`${API}/api/invitations/${created.id}/publish`);
  expect(publish.ok(), await publish.text()).toBeTruthy();
  const published = (await publish.json()) as { shareSlug: string };

  const res = await page.goto(`${FE}/i/${published.shareSlug}`, {
    waitUntil: 'networkidle',
    timeout: 90_000,
  });
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('public-invitation-document')).toHaveAttribute('data-concept', 'FUNERAL');
  await expect(page.locator('[data-visual-template]')).toHaveCount(0);
  await expect(page.getByText('수락고인').first()).toBeVisible();
  await expect(page.getByText('수락장례식장').first()).toBeVisible();
  await assertNoBrokenImages(page);

  // map if present
  const map = page.getByTestId('public-map').or(page.getByTestId('map-provider-placeholder'));
  if (await map.count()) {
    await map.first().scrollIntoViewIfNeeded();
  }

  // share block
  await expect(page.getByTestId('invitation-share-block').or(page.getByText('Share').first())).toBeVisible();

  // reload persistence
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('수락고인').first()).toBeVisible();
  await expect(page.getByTestId('public-invitation-document')).toHaveAttribute('data-concept', 'FUNERAL');

  const after = await page.request.get(`${API}/api/invitations/${created.id}`);
  const afterJson = (await after.json()) as { dataJson?: Record<string, unknown> };
  expect(afterJson.dataJson?.visualTemplateId).toBeUndefined();

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  writeJsonArtifact('artifacts/visual-template-acceptance/funeral-browser.json', {
    id: created.id,
    shareSlug: published.shareSlug,
    pageErrors,
    status: 'PASS',
  });
  await context.close();
});

test('FUNERAL createPublish helper path', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await loginInBrowser(page, `funeral2-${Date.now()}@example.com`);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded' });
  const published = await createPublishInvitation(page.request, {
    conceptType: 'FUNERAL',
    templateKey: 'funeral_classic',
    data: FUNERAL_DATA,
    title: '수락고인 추모2',
  });
  await page.goto(`${FE}/i/${published.shareSlug}`, { waitUntil: 'networkidle' });
  await expect(page.getByTestId('public-invitation-document')).toHaveAttribute('data-concept', 'FUNERAL');
  await context.close();
});
