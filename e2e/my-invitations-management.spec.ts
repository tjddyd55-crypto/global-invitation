/**
 * My invitations — status tabs + safe draft delete (development).
 */
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const FE = process.env.E2E_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';
const BE = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';

test.describe('my invitations management', () => {
  test.use({
    baseURL: FE,
    storageState: { cookies: [], origins: [] },
  });

  test('tabs filter drafts and delete confirm stays until explicit action', async ({ browser }) => {
    const email = `my-invitations-qa-${Date.now()}@example.com`;
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const token = await loginAndStoreSession(page, email);
    const first = await createDraft(page, token, `QA 삭제 대상 ${Date.now()}`);
    const second = await createDraft(page, token, `QA 유지 ${Date.now()}`);

    await page.goto('/my-invitations', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('my-invitations-workspace')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('invitation-tab-editing')).toBeVisible();
    await expect(page.getByTestId('invitation-tab-sharing')).toBeVisible();
    await expect(page.getByTestId('invitation-tab-expired')).toBeVisible();

    const editingCount = Number(await page.getByTestId('invitation-tab-editing').getAttribute('data-count'));
    expect(editingCount).toBeGreaterThanOrEqual(2);

    await page.getByTestId('invitation-tab-sharing').click();
    await expect(page.getByTestId('invitation-empty-sharing')).toBeVisible();

    await page.getByTestId('invitation-tab-expired').click();
    await expect(page.getByTestId('invitation-empty-expired')).toBeVisible();

    await page.getByTestId('invitation-tab-editing').click();
    const firstCard = page.getByTestId(`invitation-card-${first.id}`);
    await expect(firstCard).toBeVisible();
    await expect(page.getByTestId(`invitation-card-${second.id}`)).toBeVisible();

    await firstCard.getByTestId('invitation-delete').click();
    const dialog = page.getByTestId('invitation-delete-dialog');
    await expect(dialog).toBeVisible();
    await page.getByTestId('invitation-delete-dialog-backdrop').click({ position: { x: 8, y: 8 } });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).toHaveCount(0);

    await firstCard.getByTestId('invitation-delete').click();
    await page.getByTestId('invitation-delete-dialog-confirm').click();
    await expect(firstCard).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByTestId(`invitation-card-${second.id}`)).toBeVisible();
    await expect(page.getByTestId('invitation-tab-editing')).toHaveAttribute(
      'data-count',
      String(editingCount - 1)
    );

    await page.request.delete(`${BE}/api/invitations/${second.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await context.close();
  });

  test('delete API rejects unauthenticated and non-owner, then idempotent owner delete', async ({
    playwright,
  }) => {
    const ownerEmail = `my-invitations-owner-${Date.now()}@example.com`;
    const otherEmail = `my-invitations-other-${Date.now()}@example.com`;
    const ownerApi = await playwright.request.newContext({ baseURL: BE });
    const otherApi = await playwright.request.newContext({ baseURL: BE });
    const anonApi = await playwright.request.newContext({ baseURL: BE });

    try {
      const ownerToken = await loginApi(ownerApi, ownerEmail);
      const created = await ownerApi.post('/api/invitations', {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'Content-Type': 'application/json',
        },
        data: { templateKey: 'invitation_full', conceptType: 'GENERAL' },
      });
      expect(created.ok()).toBeTruthy();
      const invitation = (await created.json()) as { id: string };

      const anonDelete = await anonApi.delete(`/api/invitations/${invitation.id}`);
      expect(anonDelete.status()).toBe(401);

      const otherToken = await loginApi(otherApi, otherEmail);
      const forbidden = await otherApi.delete(`/api/invitations/${invitation.id}`, {
        headers: { Authorization: `Bearer ${otherToken}` },
      });
      expect(forbidden.status()).toBe(403);

      const ownerDelete = await ownerApi.delete(`/api/invitations/${invitation.id}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      expect(ownerDelete.ok()).toBeTruthy();
      const repeat = await ownerApi.delete(`/api/invitations/${invitation.id}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      expect(repeat.ok()).toBeTruthy();
    } finally {
      await ownerApi.dispose();
      await otherApi.dispose();
      await anonApi.dispose();
    }
  });

  test('mobile 390 tabs do not overflow', async ({ browser }) => {
    const email = `my-invitations-mobile-${Date.now()}@example.com`;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await loginAndStoreSession(page, email);
    await page.goto('/my-invitations', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('invitation-status-tabs')).toBeVisible({ timeout: 60_000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBeFalsy();
    await context.close();
  });
});

async function loginApi(api: APIRequestContext, email: string): Promise<string> {
  const login = await api.post('/api/test-login', { data: { email } });
  expect(login.ok()).toBeTruthy();
  const state = await api.storageState();
  const auth = state.cookies.find((cookie) => cookie.name === 'auth_session_token');
  expect(auth).toBeTruthy();
  return auth!.value;
}

async function loginAndStoreSession(page: Page, email: string): Promise<string> {
  const login = await page.request.post(`${BE}/api/test-login`, { data: { email } });
  expect(login.ok()).toBeTruthy();
  const loginBody = (await login.json()) as { userId?: string };
  const cookies = await page.context().cookies(BE);
  const auth = cookies.find((cookie) => cookie.name === 'auth_session_token');
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
    { token: auth!.value, userId: loginBody.userId || '', userEmail: email }
  );
  return auth!.value;
}

async function createDraft(page: Page, token: string, title: string): Promise<{ id: string }> {
  return page.evaluate(
    async ({ api, token: authToken, title: draftTitle }) => {
      const res = await fetch(`${api}/api/invitations`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ templateKey: 'invitation_full', conceptType: 'GENERAL' }),
      });
      const body = (await res.json()) as { id?: string };
      if (!res.ok || !body.id) throw new Error('CREATE_FAILED');
      const patch = await fetch(`${api}/api/invitations/${body.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: draftTitle }),
      });
      if (!patch.ok) throw new Error('PATCH_FAILED');
      return { id: body.id };
    },
    { api: BE, token, title }
  );
}
