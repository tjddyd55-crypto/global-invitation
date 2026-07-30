import { getApiBaseUrl, normalizeApiBaseUrl } from '@/src/lib/apiBase';
import type { SupportedTemplateKey, TemplateDefinition } from '@/src/templates/registry';

export const ADMIN_API_BASE_URL_ERROR = 'ADMIN API BASE URL NOT SET';

let adminApiBaseDebugLogged = false;

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/**
 * Admin API must use an absolute backend origin (never same-origin `/api/...` on the Next host).
 *
 * Railway frontend: set
 *   NEXT_PUBLIC_ADMIN_API_BASE_URL=https://backend-production-xxxx.up.railway.app
 * Local: set NEXT_PUBLIC_ADMIN_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL to e.g. http://localhost:3001
 */
export function getAdminApiBaseUrl(): string {
  const dedicated = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.trim();
  if (dedicated) {
    const normalized = normalizeApiBaseUrl(dedicated);
    if (!isAbsoluteHttpUrl(normalized)) {
      throw new Error(ADMIN_API_BASE_URL_ERROR);
    }
    if (!adminApiBaseDebugLogged) {
      adminApiBaseDebugLogged = true;
      // eslint-disable-next-line no-console -- intentional deploy/debug aid for admin routing
      console.log('ADMIN API BASE:', normalized);
    }
    return normalized;
  }

  const shared = getApiBaseUrl().trim();
  if (shared && isAbsoluteHttpUrl(shared)) {
    const normalized = normalizeApiBaseUrl(shared);
    if (!adminApiBaseDebugLogged) {
      adminApiBaseDebugLogged = true;
      // eslint-disable-next-line no-console -- intentional deploy/debug aid for admin routing
      console.log('ADMIN API BASE:', normalized);
    }
    return normalized;
  }

  throw new Error(ADMIN_API_BASE_URL_ERROR);
}

/** Always returns an absolute URL; all admin fetches must use this (never raw `/api/admin/...`). */
export function buildAdminApiUrl(path: string): string {
  const base = getAdminApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
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

export type AdminMusicCategory = 'COMMON' | 'WEDDING' | 'FUNERAL' | 'GENERAL';

export type AdminMusicTrack = {
  id: string;
  title: string;
  artistName: string | null;
  description: string | null;
  category: AdminMusicCategory;
  originalFilename: string;
  objectKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  durationSeconds: number | null;
  sortOrder: number;
  isActive: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  licenseType: string | null;
  licenseSource: string | null;
  licenseSourceUrl: string | null;
  attributionText: string | null;
  attributionRequired: boolean;
  commercialUseConfirmed: boolean;
  uploadedByAdminId: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminMusicSummary = {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  recent: AdminMusicTrack[];
  totalBytes: number;
};

export type AdminMusicFilters = {
  search?: string;
  category?: AdminMusicCategory;
  isActive?: boolean;
  isArchived?: boolean;
};

export type PresignAdminMusicInput = {
  contentType: string;
  filename?: string;
  fileSize: number;
  category: AdminMusicCategory;
};

export type ConfirmAdminMusicInput = {
  objectKey: string;
  title: string;
  category: AdminMusicCategory;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  durationSeconds?: number | null;
  artistName?: string | null;
  description?: string | null;
  licenseType?: string | null;
  licenseSource?: string | null;
  licenseSourceUrl?: string | null;
  attributionText?: string | null;
  attributionRequired?: boolean;
  commercialUseConfirmed: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateAdminMusicInput = Partial<
  Pick<
    ConfirmAdminMusicInput,
    | 'title'
    | 'category'
    | 'durationSeconds'
    | 'artistName'
    | 'description'
    | 'licenseType'
    | 'licenseSource'
    | 'licenseSourceUrl'
    | 'attributionText'
    | 'attributionRequired'
    | 'commercialUseConfirmed'
    | 'isActive'
    | 'sortOrder'
  >
>;

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
    shareSlug?: string | null;
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
    shareSlug?: string | null;
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

export async function listAdminMusic(filters: AdminMusicFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
  if (filters.isArchived !== undefined) params.set('isArchived', String(filters.isArchived));
  const query = params.toString();
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/music${query ? `?${query}` : ''}`),
    buildAdminRequestInit()
  );
  return parseJsonOrThrow<AdminMusicTrack[]>(response);
}

export async function getAdminMusicSummary() {
  const response = await fetch(
    buildAdminApiUrl('/api/admin/music/summary'),
    buildAdminRequestInit()
  );
  return parseJsonOrThrow<AdminMusicSummary>(response);
}

export async function presignAdminMusic(payload: PresignAdminMusicInput) {
  const response = await fetch(
    buildAdminApiUrl('/api/admin/music/presign'),
    buildAdminRequestInit({ method: 'POST', body: JSON.stringify(payload) })
  );
  return parseJsonOrThrow<{
    uploadUrl: string;
    objectKey: string;
    publicUrl: string;
    headers?: Record<string, string>;
    expiresIn: number;
  }>(response);
}

export async function confirmAdminMusic(payload: ConfirmAdminMusicInput) {
  const response = await fetch(
    buildAdminApiUrl('/api/admin/music/confirm'),
    buildAdminRequestInit({ method: 'POST', body: JSON.stringify(payload) })
  );
  return parseJsonOrThrow<AdminMusicTrack>(response);
}

export async function updateAdminMusic(trackId: string, payload: UpdateAdminMusicInput) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/music/${encodeURIComponent(trackId)}`),
    buildAdminRequestInit({ method: 'PATCH', body: JSON.stringify(payload) })
  );
  return parseJsonOrThrow<AdminMusicTrack>(response);
}

export async function archiveAdminMusic(trackId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/music/${encodeURIComponent(trackId)}/archive`),
    buildAdminRequestInit({ method: 'POST', body: JSON.stringify({}) })
  );
  return parseJsonOrThrow<AdminMusicTrack>(response);
}

export async function deleteAdminMusic(trackId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/music/${encodeURIComponent(trackId)}`),
    buildAdminRequestInit({ method: 'DELETE' })
  );
  return parseJsonOrThrow<AdminMusicTrack>(response);
}

export async function getAdminMusicUsage(trackId: string) {
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/music/${encodeURIComponent(trackId)}/usage`),
    buildAdminRequestInit()
  );
  return parseJsonOrThrow<{ count: number; invitationIds: string[] }>(response);
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

export type AdminTemplatePreviewBundle = {
  template: TemplateDefinition;
  /** 템플릿 레코드와 동일; 클라이언트 계약상 최상위로도 내려줍니다. */
  studioConfig?: Record<string, unknown> | null;
  previewMode: 'sample' | 'real';
  sampleData: Record<string, unknown> | null;
};

/** 공개/관리자 미리보기 번들 (비공개 템플릿은 관리자 쿠키 필요). */
export async function fetchAdminTemplatePreviewBundle(
  identifier: string,
  options?: { mode?: 'sample' | 'real' }
) {
  const encoded = encodeURIComponent(identifier);
  const query = options?.mode === 'real' ? '?mode=real' : '';
  const response = await fetch(
    buildAdminApiUrl(`/api/templates/${encoded}/preview${query}`),
    buildAdminRequestInit()
  );
  return parseJsonOrThrow<AdminTemplatePreviewBundle>(response);
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

/** 관리자 전용 라이프사이클 변경 (전이 검증은 백엔드). REJECTED 시 rejectReason 필수. */
export async function updateTemplateStatus(
  templateId: string,
  lifecycleStatus: string,
  options?: { rejectReason?: string }
) {
  const body: Record<string, string> = { lifecycleStatus };
  if (options?.rejectReason !== undefined) {
    body.rejectReason = options.rejectReason;
  }
  const response = await fetch(
    buildAdminApiUrl(`/api/admin/templates/${templateId}`),
    buildAdminRequestInit({
      method: 'PATCH',
      body: JSON.stringify(body),
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
