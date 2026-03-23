import { getApiBaseUrl, normalizeApiBaseUrl } from '@/src/lib/apiBase';
import type { SupportedTemplateKey, TemplateDefinition } from '@/src/templates/registry';

/**
 * Admin API must hit the real backend host when the Next app is on a different origin
 * (e.g. Railway frontend → Railway API). Set on the frontend service:
 *   NEXT_PUBLIC_ADMIN_API_BASE_URL=https://backend-production-xxxx.up.railway.app
 * If unset, falls back to NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_BACKEND_URL / NEXT_PUBLIC_API_URL.
 */
function getAdminApiBaseUrl(): string {
  const dedicated = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.trim();
  if (dedicated) {
    return normalizeApiBaseUrl(dedicated);
  }
  return getApiBaseUrl();
}

export function buildAdminApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getAdminApiBaseUrl();
  if (!base) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
}

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export type AdminSession = {
  role: AdminRole;
  email: string;
};

export type AdminDashboardSummary = {
  totalTemplates: number;
  activeTemplates: number;
  totalInvitationsCreated: number;
  invitationsCreatedToday: number;
  creatorTemplates: number;
  systemTemplates: number;
  revenueSummary: {
    totalTemplatePrice: number;
    totalCreatorEarnings: number;
    totalPlatformEarnings: number;
  };
};

export type AdminInvitationGuest = {
  id: string;
  guestName: string;
  attendance: 'yes' | 'no' | 'maybe';
  guestCount: number;
  mealChoice?: string | null;
  message?: string | null;
  isHidden: boolean;
  createdAt: string;
};

export type AdminInvitationGuestList = {
  invitation: {
    id: string;
    slug: string;
    title?: string | null;
    rsvpDeadline?: string | null;
  };
  totalGuests: number;
  totalPeople: number;
  attendingPeople: number;
  declinedPeople: number;
  maybePeople: number;
  guests: AdminInvitationGuest[];
};

export type InvitationAnalyticsSummary = {
  invitation: {
    id: string;
    slug: string;
    title?: string | null;
  };
  totalViews: number;
  uniqueSessions: number;
  viewsToday: number;
  viewsLast7Days: number;
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
    unknown: number;
  };
  referrerBreakdown: Array<{
    referrer: string;
    count: number;
  }>;
  rsvpSummary: {
    totalGuests: number;
    totalPeople: number;
    attendingPeople: number;
    declinedPeople: number;
    maybePeople: number;
  };
  conversionRate: number;
};

export type AdminTemplateSubmission = {
  id: string;
  creatorId: string;
  category: string;
  templateKeyCandidate: string;
  name: string;
  description: string;
  style: string;
  price: number;
  creatorShare: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  studioConfig: Record<string, unknown> | null;
  previewThumbnailUrl: string | null;
  parentSubmissionId: string | null;
  revisionNumber: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  approvedTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; email: string | null } | null;
  approvedTemplate?: { id: string; slug: string; templateKey: string; isActive: boolean } | null;
};

export type AdminTemplatePayload = {
  name: string;
  category: TemplateDefinition['category'];
  style: TemplateDefinition['style'];
  description: string;
  price: number;
  creatorShare: number;
  creatorId?: string;
  component?: string;
  templateKey: SupportedTemplateKey;
};

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const payload = (await response.json()) as { error?: string };
      errorMessage = payload.error || errorMessage;
    } catch {
      errorMessage = await response.text().catch(() => errorMessage);
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * Admin API calls are cross-origin in production; cookies only attach when
 * credentials: 'include' is set and the backend uses SameSite=None + CORS credentials.
 */
export function buildAdminRequestInit(init?: RequestInit): RequestInit {
  const { credentials: _c, cache: _cache, headers: incomingHeaders, ...rest } = init || {};
  return {
    ...rest,
    cache: 'no-store',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(incomingHeaders || {}),
    },
  };
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch(
    buildAdminApiUrl('/api/admin/login'),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  );
  return parseJsonOrThrow<{ success: true; role: AdminRole; email: string }>(response);
}

export async function logoutAdmin() {
  const response = await fetch(
    buildAdminApiUrl('/api/admin/logout'),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify({}),
    })
  );
  return parseJsonOrThrow<{ success: true }>(response);
}

export async function getAdminSession() {
  const response = await fetch(buildAdminApiUrl('/api/admin/me'), buildAdminRequestInit());
  return parseJsonOrThrow<AdminSession>(response);
}

export async function getAdminDashboardSummary() {
  const response = await fetch(buildAdminApiUrl('/api/admin/dashboard'), buildAdminRequestInit());
  return parseJsonOrThrow<AdminDashboardSummary>(response);
}

export async function listAdminTemplates(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(buildAdminApiUrl(`/api/admin/templates${query}`), buildAdminRequestInit());
  return parseJsonOrThrow<TemplateDefinition[]>(response);
}

export async function getAdminTemplate(templateId: string) {
  const response = await fetch(buildAdminApiUrl(`/api/admin/templates/${templateId}`), buildAdminRequestInit());
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function createAdminTemplate(payload: AdminTemplatePayload) {
  const response = await fetch(
    buildAdminApiUrl('/api/admin/templates'),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify(payload),
    })
  );
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function updateAdminTemplate(templateId: string, payload: Partial<AdminTemplatePayload>) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/templates/${templateId}`),
    buildAdminRequestInit({
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  );
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function disableAdminTemplate(templateId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/templates/${templateId}/disable`),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify({}),
    })
  );
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function deleteAdminTemplate(templateId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/templates/${templateId}/delete`),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify({}),
    })
  );
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function getAdminInvitationGuestList(
  invitationId: string,
  filters?: {
    search?: string;
    attendance?: '' | 'yes' | 'no' | 'maybe';
  }
) {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters?.attendance) {
    params.set('attendance', filters.attendance);
  }
  const query = params.toString();
  const response = await fetch(
    buildAdminApiUrl(`/api/rsvp/${invitationId}${query ? `?${query}` : ''}`),
    buildAdminRequestInit()
  );
  return parseJsonOrThrow<AdminInvitationGuestList>(response);
}

export async function exportAdminInvitationGuestCsv(invitationId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/invitations/${invitationId}/rsvp/export`),
    buildAdminRequestInit({
      method: 'GET',
      headers: {},
    })
  );

  if (!response.ok) {
    let errorMessage = 'CSV export failed';
    try {
      const payload = (await response.json()) as { error?: string };
      errorMessage = payload.error || errorMessage;
    } catch {
      errorMessage = await response.text().catch(() => errorMessage);
    }
    throw new Error(errorMessage);
  }

  return response.blob();
}

export async function deleteAdminRsvp(rsvpId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/rsvp/${rsvpId}`),
    buildAdminRequestInit({
      method: 'DELETE',
    })
  );
  return parseJsonOrThrow<{ success: true }>(response);
}

export async function updateAdminRsvpVisibility(rsvpId: string, isHidden: boolean) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/rsvp/${rsvpId}`),
    buildAdminRequestInit({
      method: 'PATCH',
      body: JSON.stringify({ isHidden }),
    })
  );
  return parseJsonOrThrow<{
    success: true;
    rsvp: AdminInvitationGuest & { invitationId: string };
  }>(response);
}

export async function getInvitationAnalytics(invitationId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/invitations/${invitationId}/analytics`),
    buildAdminRequestInit()
  );
  return parseJsonOrThrow<InvitationAnalyticsSummary>(response);
}

export async function listAdminTemplateSubmissions() {
  const response = await fetch(buildAdminApiUrl('/api/admin/template-submissions'), buildAdminRequestInit());
  return parseJsonOrThrow<AdminTemplateSubmission[]>(response);
}

export async function getAdminTemplateSubmission(submissionId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/template-submissions/${submissionId}`),
    buildAdminRequestInit()
  );
  return parseJsonOrThrow<AdminTemplateSubmission>(response);
}

export async function approveAdminTemplateSubmission(
  submissionId: string,
  payload?: { reviewNote?: string; creatorShare?: number }
) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/template-submissions/${submissionId}/approve`),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify(payload || {}),
    })
  );
  return parseJsonOrThrow<AdminTemplateSubmission>(response);
}

export async function rejectAdminTemplateSubmission(submissionId: string, payload?: { reviewNote?: string }) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/template-submissions/${submissionId}/reject`),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify(payload || {}),
    })
  );
  return parseJsonOrThrow<AdminTemplateSubmission>(response);
}
