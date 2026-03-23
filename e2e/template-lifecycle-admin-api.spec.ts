/**
 * 운영 체크리스트: 템플릿 라이프사이클 + preview(real) + marketplace + 반려 사유 (API E2E)
 *
 * 사전 조건: 백엔드가 localhost:3001 에서 실행 중, NODE_ENV !== production (test-login 사용),
 * ADMIN_ID / ADMIN_PASSWORD 또는 기본 dev 자격 증명.
 *
 * 참고:
 * - 크리에이터가 CREATED 템플릿을 만드는 공개 POST /api/templates/my 는 없음 → 관리자가 CREATED(DRAFT)로 생성 후 크리에이터가 studioConfig PATCH.
 * - 반려 후 승인까지 가려면 REJECTED → PENDING_REVIEW(관리자) 전이가 필요함 (시나리오 5-6 단독 PATCH APPROVED 는 409).
 * - 일반 유저의 관리자 API 호출은 세션 없이 401 ADMIN_AUTH_REQUIRED (403 아님).
 */
import crypto from 'crypto';
import { expect, test } from '@playwright/test';

const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:3001';
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin!2345';

function studioConfigSample() {
  return {
    category: 'wedding',
    theme: {
      primaryColor: '#e8a3b3',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'Inter',
      spacingScale: 'normal',
    },
    sections: {},
    sectionOrder: [],
  };
}

async function jsonOrText(res: { status: () => number; json: () => Promise<unknown>; text: () => Promise<string> }) {
  const status = res.status();
  try {
    return { status, body: await res.json() };
  } catch {
    return { status, body: await res.text() };
  }
}

test.describe('Template lifecycle + preview + marketplace + reject (API)', () => {
  test.describe.configure({ mode: 'serial' });

  test('full flow: CREATED → submit → reject → requeue → approve → publish → marketplace → archive', async ({
    request,
  }) => {
    test.setTimeout(120_000);
    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const creatorEmail = `e2e-lifecycle-${suffix}@test.local`;
    const templateName = `E2E Lifecycle ${suffix}`;

    const creator = await request.newContext({ baseURL: API_BASE_URL });
    const admin = await request.newContext({ baseURL: API_BASE_URL });

    const loginRes = await creator.post('/api/test-login/', { data: { email: creatorEmail } });
    expect(loginRes.ok(), await loginRes.text()).toBeTruthy();
    const loginJson = (await loginRes.json()) as { userId: string };
    const creatorId = loginJson.userId;

    const enrollRes = await creator.post('/api/creator/enroll', { data: {} });
    expect(enrollRes.ok(), await enrollRes.text()).toBeTruthy();

    const adminLogin = await admin.post('/api/admin/login', {
      data: { adminId: ADMIN_ID, password: ADMIN_PASSWORD },
    });
    expect(adminLogin.ok(), await adminLogin.text()).toBeTruthy();

    const me = await admin.get('/api/admin/me');
    expect(me.status(), await me.text()).toBe(200);

    const createRes = await admin.post('/api/admin/templates', {
      data: {
        name: templateName,
        category: 'wedding',
        style: 'modern',
        description: 'E2E lifecycle template',
        templateKey: 'wedding_classic',
        creatorId,
        status: 'CREATED',
        price: 0,
        creatorShare: 50,
        previewThumbnailUrl: `https://example.com/e2e-${suffix}.webp`,
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { id: string; lifecycleStatus: string };
    const templateId = created.id;
    expect(created.lifecycleStatus).toBe('CREATED');

    const patchCfg = await creator.patch(`/api/templates/my/${templateId}`, {
      data: { studioConfig: studioConfigSample() },
    });
    expect(patchCfg.ok(), await patchCfg.text()).toBeTruthy();

    const submitRes = await creator.post(`/api/templates/my/${templateId}/submit`, { data: {} });
    expect(submitRes.ok(), await submitRes.text()).toBeTruthy();
    const submitted = (await submitRes.json()) as { lifecycleStatus: string };
    expect(submitted.lifecycleStatus).toBe('PENDING_REVIEW');

    const adminList = await admin.get('/api/admin/templates');
    expect(adminList.ok()).toBeTruthy();
    const adminRows = (await adminList.json()) as Array<{ id: string; lifecycleStatus: string }>;
    const row = adminRows.find((r) => r.id === templateId);
    expect(row).toBeTruthy();
    expect(row?.lifecycleStatus).toBe('PENDING_REVIEW');

    const preview = await admin.get(`/api/templates/${templateId}/preview?mode=real`);
    expect(preview.ok(), await preview.text()).toBe(200);
    const bundle = (await preview.json()) as {
      previewMode: string;
      sampleData: unknown;
      template: { studioConfig?: unknown };
    };
    expect(bundle.previewMode).toBe('real');
    expect(bundle.sampleData).toBeNull();
    expect(bundle.template.studioConfig).toBeTruthy();

    const rejectNoReason = await admin.patch(`/api/admin/templates/${templateId}`, {
      data: { status: 'REJECTED' },
    });
    const rejectNo = await jsonOrText(rejectNoReason);
    expect(rejectNo.status).toBe(400);
    expect(JSON.stringify(rejectNo.body)).toContain('REJECT_REASON_REQUIRED');

    const rejectOk = await admin.patch(`/api/admin/templates/${templateId}`, {
      data: { status: 'REJECTED', rejectReason: '테스트 반려 사유' },
    });
    expect(rejectOk.ok(), await rejectOk.text()).toBeTruthy();
    const rejected = (await rejectOk.json()) as { lifecycleStatus: string };
    expect(rejected.lifecycleStatus).toBe('REJECTED');

    const myList = await creator.get('/api/templates/my');
    expect(myList.ok()).toBeTruthy();
    const mine = (await myList.json()) as Array<{
      id: string;
      lifecycleStatus: string;
      adminRejectReason?: string | null;
    }>;
    const mineRow = mine.find((t) => t.id === templateId);
    expect(mineRow?.lifecycleStatus).toBe('REJECTED');
    expect(mineRow?.adminRejectReason).toContain('테스트 반려 사유');

    const backToReview = await admin.patch(`/api/admin/templates/${templateId}`, {
      data: { status: 'PENDING_REVIEW' },
    });
    expect(backToReview.ok(), await backToReview.text()).toBeTruthy();

    const approve = await admin.patch(`/api/admin/templates/${templateId}`, {
      data: { status: 'APPROVED' },
    });
    expect(approve.ok(), await approve.text()).toBeTruthy();
    expect(((await approve.json()) as { lifecycleStatus: string }).lifecycleStatus).toBe('APPROVED');

    const publish = await admin.patch(`/api/admin/templates/${templateId}`, {
      data: { status: 'PUBLISHED' },
    });
    expect(publish.ok(), await publish.text()).toBeTruthy();
    expect(((await publish.json()) as { lifecycleStatus: string }).lifecycleStatus).toBe('PUBLISHED');

    const market = await request.get(`${API_BASE_URL}/api/templates/marketplace`);
    expect(market.ok()).toBeTruthy();
    const marketRows = (await market.json()) as Array<{ id: string }>;
    expect(marketRows.some((t) => t.id === templateId)).toBeTruthy();

    const archive = await admin.patch(`/api/admin/templates/${templateId}`, {
      data: { status: 'ARCHIVED' },
    });
    expect(archive.ok(), await archive.text()).toBeTruthy();

    const marketAfter = await request.get(`${API_BASE_URL}/api/templates/marketplace`);
    expect(marketAfter.ok()).toBeTruthy();
    const afterRows = (await marketAfter.json()) as Array<{ id: string }>;
    expect(afterRows.some((t) => t.id === templateId)).toBeFalsy();

    await creator.dispose();
    await admin.dispose();
  });

  test('failure: USER session cannot call admin templates list', async ({ request }) => {
    const user = await request.newContext({ baseURL: API_BASE_URL });
    await user.post('/api/test-login', { data: { email: `e2e-user-${Date.now()}@test.local` } });
    const res = await user.get('/api/admin/templates');
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect((body as { error?: string }).error).toBe('ADMIN_AUTH_REQUIRED');
    await user.dispose();
  });

  test('failure: CREATED → PUBLISHED direct transition rejected', async ({ request }) => {
    const admin = await request.newContext({ baseURL: API_BASE_URL });
    const login = await admin.post('/api/admin/login', {
      data: { adminId: ADMIN_ID, password: ADMIN_PASSWORD },
    });
    expect(login.ok()).toBeTruthy();

    const createRes = await admin.post('/api/admin/templates', {
      data: {
        name: `E2E Bad Transition ${Date.now()}`,
        category: 'wedding',
        style: 'modern',
        description: 'invalid transition test',
        templateKey: 'wedding_classic',
        status: 'CREATED',
        price: 0,
        creatorShare: 50,
      },
    });
    expect(createRes.status()).toBe(201);
    const { id } = (await createRes.json()) as { id: string };

    const bad = await admin.patch(`/api/admin/templates/${id}`, { data: { status: 'PUBLISHED' } });
    expect(bad.status()).toBe(409);
    const payload = (await bad.json()) as { error: string };
    expect(payload.error).toBe('INVALID_TEMPLATE_STATUS_TRANSITION');

    await admin.dispose();
  });
});
