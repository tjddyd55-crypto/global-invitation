import crypto from 'crypto';
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001';
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin!2345';

test.describe('Creator 운영 UI 흐름', () => {
  test('creator가 /creator/templates/new 에서 생성 후 저장/수정/제출할 수 있어야 함', async ({ page }) => {
    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const templateName = `UI Creator ${suffix}`;
    const templateDescription = `UI flow verify ${suffix}`;
    const templateKey = `ui_flow_${suffix.replace(/-/g, '_')}`;

    await postOrThrow(page.request, `${API_BASE_URL}/api/creator/enroll`, {}, 'creator enroll');

    await page.goto('/creator/templates/new');
    await page.getByTestId('creator-category-select-wedding').click();
    await Promise.all([
      page.waitForURL(/\/creator\/templates\/[^/]+\/studio/, { timeout: 15_000 }),
      page.getByTestId('creator-enter-studio-button').click(),
    ]);

    await page.getByTestId('creator-meta-name-input').fill(templateName);
    await page.getByTestId('creator-meta-description-input').fill(templateDescription);
    await page.getByTestId('creator-meta-key-input').fill(templateKey);
    await page.getByTestId('creator-meta-thumbnail-url-input').fill(`https://example.com/${suffix}.webp`);
    await page.getByTestId('creator-save-draft-button').click();
    await expect(page.getByText('Draft saved')).toBeVisible();

    await page.getByTestId('creator-submit-review-button').click();
    await expect(page.getByText('Current status: SUBMITTED')).toBeVisible();

    const submissionId = resolveSubmissionIdFromUrl(page.url());
    const payload = await getJsonOrThrow<{ status: string; name: string; description: string }>(
      page.request,
      `${API_BASE_URL}/api/creator/template-submissions/${submissionId}`,
      'fetch submitted creator template'
    );
    expect(payload.status).toBe('SUBMITTED');
    expect(payload.name).toBe(templateName);
    expect(payload.description).toBe(templateDescription);
  });

  test('creator dashboard에서 반려 사유와 재제출 버튼이 표시되고 재제출이 동작해야 함', async ({ page }) => {
    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const templateName = `UI Rejected ${suffix}`;
    const rejectReason = `QA reject ${suffix}`;

    await postOrThrow(page.request, `${API_BASE_URL}/api/creator/enroll`, {}, 'creator enroll');
    const created = await postOrThrow<{ id: string }>(
      page.request,
      `${API_BASE_URL}/api/creator/template-submissions`,
      {
        category: 'wedding',
        templateKeyCandidate: `ui_rejected_${suffix.replace(/-/g, '_')}`,
        name: templateName,
        description: 'reject and resubmit flow',
        style: 'modern',
        price: 200,
        previewThumbnailUrl: `https://example.com/rejected-${suffix}.webp`,
        studioConfig: buildWeddingStudioConfig(),
      },
      'create submission for reject flow',
      201
    );

    await postOrThrow(
      page.request,
      `${API_BASE_URL}/api/creator/template-submissions/${created.id}/submit`,
      {},
      'submit for reject flow'
    );

    await postOrThrow(
      page.request,
      `${API_BASE_URL}/api/admin/login`,
      { adminId: ADMIN_ID, password: ADMIN_PASSWORD },
      'admin login for reject flow'
    );
    await postOrThrow(
      page.request,
      `${API_BASE_URL}/api/admin/template-submissions/${created.id}/reject`,
      { reviewNote: rejectReason },
      'reject submission'
    );

    await page.goto('/creator/dashboard');
    await expect(page.getByText(templateName)).toBeVisible();
    await expect(page.getByText(rejectReason)).toBeVisible();

    const resubmitButton = page.getByTestId(`creator-dashboard-resubmit-${created.id}`);
    await expect(resubmitButton).toBeVisible();
    await resubmitButton.click();

    await expect
      .poll(async () => {
        const updated = await getJsonOrThrow<{ status: string }>(
          page.request,
          `${API_BASE_URL}/api/creator/template-submissions/${created.id}`,
          'fetch resubmitted creator template'
        );
        return updated.status;
      })
      .toBe('SUBMITTED');
  });
});

function resolveSubmissionIdFromUrl(url: string): string {
  const matched = url.match(/\/creator\/templates\/([^/]+)\/studio/);
  if (!matched?.[1]) {
    throw new Error(`INVALID_STUDIO_URL:${url}`);
  }
  return matched[1];
}

async function getJsonOrThrow<T>(request: APIRequestContext, url: string, action: string): Promise<T> {
  const response = await request.get(url);
  return parseJsonOrThrow<T>(response, action);
}

async function postOrThrow<T = Record<string, unknown>>(
  request: APIRequestContext,
  url: string,
  data: unknown,
  action: string,
  expectedStatus = 200
): Promise<T> {
  const response = await request.post(url, { data });
  if (response.status() !== expectedStatus) {
    const body = await response.text();
    throw new Error(`${action} failed (${response.status()}): ${body}`);
  }
  return (await response.json()) as T;
}

async function parseJsonOrThrow<T>(response: APIResponse, action: string): Promise<T> {
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`${action} failed (${response.status()}): ${body}`);
  }
  return (await response.json()) as T;
}

function buildWeddingStudioConfig() {
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
