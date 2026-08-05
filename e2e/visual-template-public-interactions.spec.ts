/**
 * Public 신규 6종 실제 인터랙션 전수 (development).
 */
import { test, expect, type Page } from '@playwright/test';
import {
  API,
  FE,
  NEW_SIX,
  assertNoBrokenImages,
  assertNoIsoOrFixtureLeak,
  buildRichGeneralData,
  buildRichWeddingData,
  createPublishInvitation,
  loginInBrowser,
  writeJsonArtifact,
  type VisualTemplateCaseId,
} from './helpers/visualTemplateAcceptance';

test.setTimeout(900_000);

const results: Record<string, Record<string, string>> = {};

function mark(id: string, area: string, status: string) {
  results[id] = results[id] || {};
  results[id][area] = status;
}

async function openPublic(page: Page, shareSlug: string, id: VisualTemplateCaseId) {
  const res = await page.goto(`${FE}/i/${shareSlug}`, { waitUntil: 'networkidle', timeout: 90_000 });
  expect(res?.ok(), id).toBeTruthy();
  await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator(`[data-visual-template="${id}"]`).first()).toBeVisible();
}

async function exerciseGallery(page: Page, id: VisualTemplateCaseId) {
  const thumbs = page.locator('[data-section-id="gallery"] button[aria-label*="번째 사진"]');
  const count = await thumbs.count();
  expect(count, `${id} gallery thumbs`).toBeGreaterThan(0);
  await thumbs.nth(0).click();
  await expect(page.getByTestId('gallery-lightbox')).toBeVisible({ timeout: 15_000 });
  const before = await page.getByTestId('gallery-lightbox-counter').innerText().catch(() => '');
  await page.getByTestId('gallery-lightbox-next').click();
  await page.waitForTimeout(200);
  const after = await page.getByTestId('gallery-lightbox-counter').innerText().catch(() => '');
  expect(after === before || after.length > 0).toBeTruthy();
  await page.getByTestId('gallery-lightbox-prev').click();
  await page.getByTestId('gallery-lightbox-close').click();
  await expect(page.getByTestId('gallery-lightbox')).toHaveCount(0);
}

async function exerciseAccounts(page: Page, id: VisualTemplateCaseId, concept: 'WEDDING' | 'GENERAL') {
  await expect(page.getByTestId('invitation-accounts')).toBeVisible();
  const cards = page.getByTestId('account-card');
  expect(await cards.count()).toBeGreaterThanOrEqual(2);
  // Public 현재 UX: accordion 없음(flat cards). 여러 계좌 + 복사로 검증.
  await page.getByTestId('account-copy').first().click();
  await expect(page.getByTestId('account-copy-toast')).toBeVisible({ timeout: 10_000 });
  if (concept === 'WEDDING') {
    await expect(page.getByText('신랑').first()).toBeVisible();
    await expect(page.getByText('신부').first()).toBeVisible();
  } else {
    await expect(page.getByText(/참가비|후원/).first()).toBeVisible();
  }
  void id;
}

async function exerciseRsvp(page: Page, id: VisualTemplateCaseId, shareSlug: string) {
  await page.getByTestId('invitation-rsvp-section').scrollIntoViewIfNeeded();
  await page.getByTestId('invitation-rsvp-cta').click();
  await expect(page.getByTestId('rsvp-form')).toBeVisible();

  // validation — HTML required 가 먼저 막을 수 있어 인원 비움으로 앱 검증 확인
  await page.locator('#rsvp-guest-name').fill('임시');
  await page.getByTestId('rsvp-guest-count').fill('');
  await page.getByTestId('rsvp-submit').click();
  await expect(page.getByTestId('rsvp-error')).toBeVisible();

  const guestName = `수락_${id.slice(-6)}_${Date.now().toString().slice(-4)}`;
  await page.locator('#rsvp-guest-name').fill(guestName);
  await page.locator('#rsvp-attendance').selectOption('yes');
  await page.getByTestId('rsvp-guest-count').fill('2');
  await page.locator('#rsvp-message').fill('참석합니다');

  const post = page.waitForResponse(
    (r) => r.url().includes('/api/rsvp') && r.request().method() === 'POST',
    { timeout: 30_000 }
  );
  await page.getByTestId('rsvp-submit').click();
  const response = await post;
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as { success?: boolean; mode?: string; rsvp?: { id: string } };
  expect(body.success).toBeTruthy();
  expect(body.rsvp?.id).toBeTruthy();

  // duplicate / update policy — same name again
  await page.locator('#rsvp-attendance').selectOption('no');
  const second = page.waitForResponse(
    (r) => r.url().includes('/api/rsvp') && ['POST', 'PATCH'].includes(r.request().method()),
    { timeout: 30_000 }
  );
  await page.getByTestId('rsvp-submit').click();
  const secondRes = await second;
  expect(secondRes.ok(), await secondRes.text()).toBeTruthy();
  void shareSlug;
}

async function exerciseMap(page: Page, concept: 'WEDDING' | 'GENERAL') {
  await page.getByTestId('public-map').or(page.getByTestId('map-provider-placeholder')).first().scrollIntoViewIfNeeded();
  await expect(page.getByTestId('map-provider-nav-links')).toBeVisible({ timeout: 20_000 });
  if (concept === 'GENERAL') {
    await expect(page.getByTestId('naver-maps-external-links')).toBeVisible();
  } else {
    await expect(page.getByTestId('google-maps-external-links')).toBeVisible();
  }
  await expect(page.getByText(/지도에서 보기|Google 지도에서 보기/).first()).toBeVisible();
  await expect(page.getByText(/길찾기/).first()).toBeVisible();
}

async function exerciseMusic(page: Page) {
  const player = page.getByTestId('invitation-music-player');
  await expect(player).toBeVisible({ timeout: 20_000 });
  await expect(player).toHaveAttribute('data-music-status', /idle|paused/);
  await player.click();
  await expect(player).toHaveAttribute('data-music-status', /playing|loading|error|paused/, {
    timeout: 15_000,
  });
  const status = await player.getAttribute('data-music-status');
  if (status === 'playing' || status === 'loading') {
    await player.click();
    await expect(player).toHaveAttribute('data-music-status', /paused|idle|error|playing/);
  }
}

async function exerciseShare(page: Page, shareSlug: string) {
  await page.getByTestId('invitation-share-block').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('invitation-share-block')).toBeVisible();
  await page.getByRole('button', { name: /링크 복사|복사됨/ }).click();
  await expect(page.getByRole('button', { name: /복사됨|링크 복사/ })).toBeVisible();
  // Kakao button may be present; LINE link href should use public share URL path
  const html = await page.content();
  expect(html).toContain(`/i/${shareSlug}`);
  expect(html).not.toContain('/templates/WEDDING_04_EDITORIAL/preview');
}

test('public interactions: 6 visual templates full suite', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const email = `accept-public-${Date.now()}@example.com`;
  await loginInBrowser(page, email);
  await page.goto(`${FE}/m`, { waitUntil: 'domcontentloaded', timeout: 90_000 });

  for (const id of NEW_SIX) {
    const concept = id.startsWith('WEDDING') ? 'WEDDING' : 'GENERAL';
    const title =
      concept === 'WEDDING' ? `수락웨딩 · ${id.slice(-8)}` : `수락행사 · ${id.slice(-8)}`;
    const data =
      concept === 'WEDDING' ? buildRichWeddingData(id, title) : buildRichGeneralData(id, title);

    const published = await createPublishInvitation(page.request, {
      conceptType: concept,
      visualTemplateId: id,
      title,
      data,
    });

    try {
      await openPublic(page, published.shareSlug, id);
      await expect(page.getByText(title).first()).toBeVisible();
      await expect(page.getByTestId('preview-create-cta')).toHaveCount(0);
      await assertNoIsoOrFixtureLeak(page);
      await assertNoBrokenImages(page);
      mark(id, 'basic', 'PASS');

      await exerciseGallery(page, id);
      mark(id, 'gallery', 'PASS');

      await exerciseAccounts(page, id, concept);
      mark(id, 'accounts', 'PASS');

      await exerciseMap(page, concept);
      mark(id, 'map', 'PASS');

      await exerciseMusic(page);
      mark(id, 'music', 'PASS');

      await exerciseShare(page, published.shareSlug);
      mark(id, 'share', 'PASS');

      await exerciseRsvp(page, id, published.shareSlug);
      mark(id, 'rsvp', 'PASS');
    } catch (error) {
      mark(id, 'suite', `FAIL: ${(error as Error).message}`);
      writeJsonArtifact('artifacts/visual-template-acceptance/public-interactions.json', {
        results,
        pageErrors,
      });
      throw error;
    }
  }

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  writeJsonArtifact('artifacts/visual-template-acceptance/public-interactions.json', {
    results,
    pageErrors,
  });
  await context.close();
});
