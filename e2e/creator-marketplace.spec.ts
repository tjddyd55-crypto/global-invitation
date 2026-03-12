import crypto from 'crypto';
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001';
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin!2345';

type DashboardSummary = {
  usageCount: number;
  viewCount: number;
  cloneCount: number;
  revenueTotal: number;
};

type VisibleTemplate = {
  id: string;
  name: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  cloneCount?: number;
};

test.describe('Creator Marketplace 회귀', () => {
  test('creator 제출 -> admin 승인 -> marketplace 노출 -> clone -> usage/revenue 집계', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const hiddenName = `E2E Hidden Draft ${suffix}`;
    const publishedName = `E2E Published ${suffix}`;

    await postOrThrow(page.request, `${API_BASE_URL}/api/creator/enroll`, {}, 'creator enroll');
    const beforeSummary = await getJsonOrThrow<DashboardSummary>(
      page.request,
      `${API_BASE_URL}/api/creator/dashboard`,
      'creator dashboard before clone'
    );

    await postOrThrow(
      page.request,
      `${API_BASE_URL}/api/creator/template-submissions`,
      {
        category: 'wedding',
        templateKeyCandidate: `hidden-${suffix}`,
        name: hiddenName,
        description: 'marketplace에 노출되면 안 되는 draft 템플릿',
        style: 'modern',
        price: 100,
        previewThumbnailUrl: `https://example.com/${suffix}-hidden.webp`,
        studioConfig: buildWeddingStudioConfig(),
      },
      'hidden draft submission create',
      201
    );

    const templatesBefore = await getJsonOrThrow<VisibleTemplate[]>(
      page.request,
      `${API_BASE_URL}/api/templates`,
      'list templates before approval'
    );
    expect(templatesBefore.some((template) => template.name === hiddenName)).toBeFalsy();

    const submission = await postOrThrow<{ id: string; status: string }>(
      page.request,
      `${API_BASE_URL}/api/creator/template-submissions`,
      {
        category: 'wedding',
        templateKeyCandidate: `publish-${suffix}`,
        name: publishedName,
        description: '승인 후 marketplace에 노출될 템플릿',
        style: 'modern',
        price: 100,
        previewThumbnailUrl: `https://example.com/${suffix}-published.webp`,
        studioConfig: buildWeddingStudioConfig(),
      },
      'review submission create',
      201
    );

    const submitted = await postOrThrow<{ status: string }>(
      page.request,
      `${API_BASE_URL}/api/creator/template-submissions/${submission.id}/submit`,
      {},
      'submission request review'
    );
    expect(submitted.status).toBe('SUBMITTED');

    await postOrThrow(
      page.request,
      `${API_BASE_URL}/api/admin/login`,
      {
        adminId: ADMIN_ID,
        password: ADMIN_PASSWORD,
      },
      'admin login for review'
    );

    const approved = await postOrThrow<{ approvedTemplateId: string | null; status: string }>(
      page.request,
      `${API_BASE_URL}/api/admin/template-submissions/${submission.id}/approve`,
      {
        reviewNote: 'E2E marketplace approve',
        creatorShare: 55,
      },
      'approve submission'
    );

    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedTemplateId).toBeTruthy();
    const approvedTemplateId = approved.approvedTemplateId as string;

    const publishedTemplate = await waitForPublishedTemplate(page.request, approvedTemplateId);
    expect(publishedTemplate.status).toBe('PUBLISHED');
    expect(publishedTemplate.name).toBe(publishedName);

    await postOrThrow(
      page.request,
      `${API_BASE_URL}/api/templates/${approvedTemplateId}/view`,
      {},
      'record published template view',
      201
    );

    const cloneResult = await postOrThrow<{
      template_version_id: string | null;
      template_key: string;
    }>(
      page.request,
      `${API_BASE_URL}/api/templates/${approvedTemplateId}/clone`,
      {},
      'clone published template',
      201
    );
    expect(cloneResult.template_version_id).toBeTruthy();
    expect(cloneResult.template_key).toBeTruthy();

    const popularTemplates = await getJsonOrThrow<VisibleTemplate[]>(
      page.request,
      `${API_BASE_URL}/api/templates?sort=popular`,
      'list popular templates after clone'
    );
    const rankedTemplate = popularTemplates.find((template) => template.id === approvedTemplateId);
    expect(rankedTemplate).toBeTruthy();
    expect((rankedTemplate?.cloneCount || 0) >= 1).toBeTruthy();

    const afterSummary = await getJsonOrThrow<DashboardSummary>(
      page.request,
      `${API_BASE_URL}/api/creator/dashboard`,
      'creator dashboard after clone'
    );
    expect(afterSummary.usageCount).toBe(beforeSummary.usageCount + 1);
    expect(afterSummary.cloneCount).toBe(beforeSummary.cloneCount + 1);
    expect(afterSummary.viewCount).toBeGreaterThanOrEqual(beforeSummary.viewCount + 1);
    expect(afterSummary.revenueTotal).toBeGreaterThanOrEqual(beforeSummary.revenueTotal + 55 - 0.01);
  });
});

async function waitForPublishedTemplate(
  request: APIRequestContext,
  templateId: string
): Promise<VisibleTemplate> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const templates = await getJsonOrThrow<VisibleTemplate[]>(
      request,
      `${API_BASE_URL}/api/templates`,
      'wait published template'
    );
    const matched = templates.find((template) => template.id === templateId);
    if (matched) {
      return matched;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`TEMPLATE_NOT_VISIBLE:${templateId}`);
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
  const response = await request.post(url, {
    data,
  });
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
