import { buildApiUrl } from '@/src/lib/apiBase';
import { buildAuthHeaders } from '@/src/lib/auth';
import type { CreatorStudioConfig } from '@/src/creator/studioConfig';

export type TemplateSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type TemplateSubmission = {
  id: string;
  creatorId: string;
  category: string;
  templateKeyCandidate: string;
  name: string;
  description: string;
  style: string;
  price: number;
  creatorShare: number;
  status: TemplateSubmissionStatus;
  studioConfig: CreatorStudioConfig | null;
  previewThumbnailUrl: string | null;
  parentSubmissionId: string | null;
  revisionNumber: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  approvedTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  approvedTemplate?: {
    id: string;
    slug: string;
    templateKey: string;
    isActive: boolean;
  } | null;
  creator?: {
    id: string;
    email: string | null;
  } | null;
};

export type CreatorDashboardSummary = {
  totalTemplates: number;
  publishedTemplates: number;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  usageCount: number;
  viewCount: number;
  cloneCount: number;
  revenueTotal: number;
  revenuePlaceholder: number;
  payoutSummary: {
    totalPaid: number;
    totalPending: number;
    payoutCount: number;
    lastPaidAt: string | null;
  };
  templateRevenueStats: Array<{
    templateId: string;
    templateName: string;
    templateSlug: string;
    templateStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
    usageCount: number;
    viewCount: number;
    cloneCount: number;
    revenueTotal: number;
    lastUsedAt: string | null;
  }>;
  recentUsages: Array<{
    usageId: string;
    templateId: string;
    templateName: string;
    invitationId: string;
    invitationSlug: string;
    usedAt: string;
    usedBy: 'USER' | 'GUEST';
    priceSnapshot: number;
    creatorRevenue: number;
  }>;
  updatedAt: string;
};

type CreateSubmissionPayload = {
  category: string;
  parentSubmissionId?: string;
  templateKeyCandidate?: string;
  name?: string;
  description?: string;
  style?: string;
  price?: number;
  previewThumbnailUrl?: string;
  studioConfig?: CreatorStudioConfig;
};

type UpdateSubmissionPayload = Omit<CreateSubmissionPayload, 'category' | 'parentSubmissionId'>;

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.message || payload.error || message;
    } catch {
      message = await response.text().catch(() => message);
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

function buildCreatorRequestInit(init?: RequestInit): RequestInit {
  return {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
      ...(init?.headers || {}),
    },
  };
}

export async function getCreatorDashboardSummary() {
  const response = await fetch(buildApiUrl('/api/creator/dashboard'), buildCreatorRequestInit());
  return parseJsonOrThrow<CreatorDashboardSummary>(response);
}

export async function enrollCreatorRole() {
  const response = await fetch(
    buildApiUrl('/api/creator/enroll'),
    buildCreatorRequestInit({
      method: 'POST',
      body: JSON.stringify({}),
    })
  );
  return parseJsonOrThrow<{
    ok: true;
    userId?: string;
    role: 'USER' | 'CREATOR' | 'ADMIN';
    isCreator?: boolean;
    alreadyEnrolled?: boolean;
  }>(response);
}

export async function listCreatorTemplateSubmissions() {
  const response = await fetch(
    buildApiUrl('/api/creator/template-submissions'),
    buildCreatorRequestInit()
  );
  return parseJsonOrThrow<TemplateSubmission[]>(response);
}

export async function getCreatorTemplateSubmission(id: string) {
  const response = await fetch(
    buildApiUrl(`/api/creator/template-submissions/${id}`),
    buildCreatorRequestInit()
  );
  return parseJsonOrThrow<TemplateSubmission>(response);
}

export async function createCreatorTemplateSubmission(payload: CreateSubmissionPayload) {
  const response = await fetch(
    buildApiUrl('/api/creator/template-submissions'),
    buildCreatorRequestInit({
      method: 'POST',
      body: JSON.stringify(payload),
    })
  );
  return parseJsonOrThrow<TemplateSubmission>(response);
}

export async function updateCreatorTemplateSubmission(id: string, payload: UpdateSubmissionPayload) {
  const response = await fetch(
    buildApiUrl(`/api/creator/template-submissions/${id}`),
    buildCreatorRequestInit({
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  );
  return parseJsonOrThrow<TemplateSubmission>(response);
}

export async function submitCreatorTemplateSubmission(id: string) {
  const response = await fetch(
    buildApiUrl(`/api/creator/template-submissions/${id}/submit`),
    buildCreatorRequestInit({
      method: 'POST',
      body: JSON.stringify({}),
    })
  );
  return parseJsonOrThrow<TemplateSubmission>(response);
}
