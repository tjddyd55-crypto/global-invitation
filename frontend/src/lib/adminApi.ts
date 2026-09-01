import { getApiBaseUrl, normalizeApiBaseUrl } from '@/src/lib/apiBase';
import { AdminLoginError } from '@/src/features/admin/adminLoginMessages';
import type { SupportedTemplateKey, TemplateDefinition } from '@/src/templates/registry';

export const ADMIN_API_BASE_URL_ERROR = 'ADMIN API BASE URL NOT SET';

let adminApiBaseDebugLogged = false;

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/**
 * Admin API base URL.
 *
 * Browser: same-origin `/api/admin/*` (Next.js rewrite → backend) so session cookies stay first-party.
 * Server/SSR: absolute backend origin when configured.
 */
export function getAdminApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }

  const dedicated = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.trim();
  if (dedicated) {
    const normalized = normalizeApiBaseUrl(dedicated);
    if (!isAbsoluteHttpUrl(normalized)) {
      throw new Error(ADMIN_API_BASE_URL_ERROR);
    }
    if (!adminApiBaseDebugLogged) {
      adminApiBaseDebugLogged = true;
      // eslint-disable-next-line no-console -- intentional deploy/debug aid for admin routing
      console.log('ADMIN API BASE (server):', normalized);
    }
    return normalized;
  }

  const shared = getApiBaseUrl().trim();
  if (shared && isAbsoluteHttpUrl(shared)) {
    const normalized = normalizeApiBaseUrl(shared);
    if (!adminApiBaseDebugLogged) {
      adminApiBaseDebugLogged = true;
      // eslint-disable-next-line no-console -- intentional deploy/debug aid for admin routing
      console.log('ADMIN API BASE (server):', normalized);
    }
    return normalized;
  }

  throw new Error(ADMIN_API_BASE_URL_ERROR);
}

/** Always returns a fetchable URL; browser uses same-origin admin proxy paths. */
export function buildAdminApiUrl(path: string): string {
  const base = getAdminApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
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

export type AdminOpsDashboard = AdminDashboardSummary & {
  runtimeEnvironment: string;
  metrics: {
    totalUsers: number;
    usersToday: number;
    usersMonth: number;
    totalInvitations: number;
    draftCount: number;
    publishedCount: number;
    invitationsToday: number;
    invitationsMonth: number;
    paidCount: number;
    paidToday: number;
    paidMonth: number;
    revenueTodayMinor: number;
    revenueMonthMinor: number;
    failedPayments: number;
    currentSalePriceMinor: number;
    currentListPriceMinor: number;
    currency: string;
  };
  payment: Record<string, unknown>;
  system: {
    paymentsEnabled: boolean;
    publishingEnabled: boolean;
    activePaymentEnvironment: string;
  };
  recent: {
    payments: Array<Record<string, unknown>>;
    invitations: Array<Record<string, unknown>>;
    users: Array<Record<string, unknown>>;
    audit: Array<Record<string, unknown>>;
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
 * Admin API SSOT — always credentials:include.
 * Browser: same-origin `/api/admin/*` via Next.js rewrite. Server: absolute backend origin.
 * Do not use the user auth client or bare fetch for /api/admin/*.
 */
export async function adminApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { credentials: _c, cache: _cache, headers: incomingHeaders, ...rest } = init;
  return fetch(buildAdminApiUrl(path), {
    ...rest,
    cache: 'no-store',
    headers: {
      ...(incomingHeaders || {}),
    },
    credentials: 'include',
  });
}

export async function adminApiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await adminApiFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return parseJsonOrThrow<T>(response);
}

/** @deprecated Prefer adminApiFetch / adminApiJson */
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

export async function loginAdmin(adminId: string, password: string) {
  const response = await adminApiFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ adminId, email: adminId, password }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json() as Promise<{ success: true; role: AdminRole; email: string }>;
  }

  let payload: { error?: string; retryAfterSeconds?: number } = {};
  try {
    payload = (await response.json()) as { error?: string; retryAfterSeconds?: number };
  } catch {
    payload = {};
  }

  const retryHeader = response.headers.get('Retry-After');
  const parsedHeader = retryHeader ? Number.parseInt(retryHeader, 10) : Number.NaN;
  const retryAfterSeconds =
    payload.retryAfterSeconds ??
    (Number.isFinite(parsedHeader) && parsedHeader > 0 ? parsedHeader : undefined);

  throw new AdminLoginError(payload.error || 'ADMIN_LOGIN_FAILED', response.status, retryAfterSeconds);
}

export async function logoutAdmin() {
  return adminApiJson<{ success: true }>('/api/admin/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getAdminSession() {
  return adminApiJson<AdminSession>('/api/admin/me');
}

export async function getAdminDashboardSummary() {
  return adminApiJson<AdminDashboardSummary>('/api/admin/dashboard');
}

export async function getAdminOpsDashboard() {
  return adminApiJson<AdminOpsDashboard>('/api/admin/ops/dashboard');
}

export async function listAdminOpsUsers(q?: string) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  const query = params.toString();
  return adminApiJson<{ users: Array<Record<string, unknown>> }>(
    `/api/admin/ops/users${query ? `?${query}` : ''}`
  );
}

export async function getAdminOpsUser(id: string) {
  return adminApiJson<Record<string, unknown>>(`/api/admin/ops/users/${id}`);
}

export async function listAdminOpsInvitations(filters: Record<string, string> = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const query = params.toString();
  return adminApiJson<{ invitations: Array<Record<string, unknown>> }>(
    `/api/admin/ops/invitations${query ? `?${query}` : ''}`
  );
}

export async function getAdminOpsInvitation(id: string) {
  return adminApiJson<Record<string, unknown>>(`/api/admin/ops/invitations/${id}`);
}

export async function listAdminOpsPayments(filters: Record<string, string> = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const query = params.toString();
  return adminApiJson<{ payments: Array<Record<string, unknown>> }>(
    `/api/admin/ops/payments${query ? `?${query}` : ''}`
  );
}

export async function getAdminOpsPayment(id: string) {
  return adminApiJson<Record<string, unknown>>(`/api/admin/ops/payments/${id}`);
}

export async function getAdminOpsPricing() {
  return adminApiJson<{
    currency: string;
    listPriceMinor: number;
    salePriceMinor: number;
    effectivePriceMinor: number;
    promoEnabled: boolean;
    promoStartsAt: string | null;
    promoEndsAt: string | null;
    source: string;
  }>('/api/admin/ops/payments/pricing');
}

export async function updateAdminOpsPricing(payload: {
  listPriceMinor: number;
  salePriceMinor: number;
  promoEnabled: boolean;
  promoStartsAt?: string | null;
  promoEndsAt?: string | null;
}) {
  return adminApiJson<Record<string, unknown>>('/api/admin/ops/payments/pricing', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getAdminOpsProviderConfig() {
  return adminApiJson<Record<string, unknown>>('/api/admin/ops/payments/provider-config');
}

export async function updateAdminOpsProviderConfig(payload: Record<string, unknown>) {
  return adminApiJson<Record<string, unknown>>('/api/admin/ops/payments/provider-config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function testAdminOpsProviderConfig(environment: 'TEST' | 'LIVE') {
  return adminApiJson<Record<string, unknown>>('/api/admin/ops/payments/provider-config/test', {
    method: 'POST',
    body: JSON.stringify({ environment }),
  });
}

export async function getAdminOpsSystem() {
  return adminApiJson<Record<string, unknown>>('/api/admin/ops/system');
}

export async function updateAdminOpsSystem(payload: Record<string, unknown>) {
  return adminApiJson<Record<string, unknown>>('/api/admin/ops/system', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function listAdminOpsAudit(limit = 50) {
  return adminApiJson<{ logs: Array<Record<string, unknown>> }>(
    `/api/admin/ops/audit?limit=${limit}`
  );
}

export async function archiveAdminOpsInvitation(invitationId: string) {
  return adminApiJson<{ success: true; id: string; archived?: boolean; alreadyArchived?: boolean }>(
    `/api/admin/ops/invitations/${encodeURIComponent(invitationId)}/archive`,
    { method: 'POST', body: '{}' }
  );
}

export async function updateAdminOpsInvitationStatus(
  invitationId: string,
  status: 'DRAFT' | 'PUBLISHED' | 'SHARED'
) {
  return adminApiJson<{ success: true; invitation: Record<string, unknown> }>(
    `/api/admin/ops/invitations/${encodeURIComponent(invitationId)}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) }
  );
}

export async function deactivateAdminOpsUser(userId: string) {
  return adminApiJson<{ success: true; id: string; deactivatedAt?: string; alreadyDeactivated?: boolean }>(
    `/api/admin/ops/users/${encodeURIComponent(userId)}/deactivate`,
    { method: 'POST', body: '{}' }
  );
}

export type AdminVisualTemplateRow = {
  id: string;
  templateKey: string;
  concept: string;
  displayNameKo: string;
  displayNameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  sourceType: string;
  status: string;
  isVisible: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isPremium: boolean;
  sortOrder: number;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  activeVersion: number | null;
  activeVersionId: string | null;
  registryOk: boolean;
  usage: { total: number; draft: number; published: number };
  updatedAt: string;
};

export type AdminVisualCatalogDrift = {
  registryTemplateCount: number;
  catalogEntryCount: number;
  activeVisibleCount: number;
  registryMissingCount: number;
  dbOrphanCount: number;
  missingInDb: string[];
  orphanInDb: string[];
};

export async function listAdminVisualTemplates(filters: {
  concept?: string;
  status?: string;
  source?: string;
  visible?: string;
  featured?: string;
  new?: string;
  q?: string;
} = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return adminApiJson<{ templates: AdminVisualTemplateRow[]; drift: AdminVisualCatalogDrift }>(
    `/api/admin/visual-templates${query ? `?${query}` : ''}`
  );
}

export async function getAdminVisualTemplate(idOrKey: string) {
  return adminApiJson<{ template: Record<string, unknown> }>(
    `/api/admin/visual-templates/${encodeURIComponent(idOrKey)}`
  );
}

export async function patchAdminVisualTemplate(
  idOrKey: string,
  payload: Record<string, unknown>
) {
  return adminApiJson<{ template: Record<string, unknown> }>(
    `/api/admin/visual-templates/${encodeURIComponent(idOrKey)}`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
}

export async function reorderAdminVisualTemplates(
  order: Array<{ id?: string; templateKey?: string }>
) {
  return adminApiJson<{ ok: true }>('/api/admin/visual-templates/reorder', {
    method: 'POST',
    body: JSON.stringify({ order }),
  });
}

export async function archiveAdminVisualTemplate(idOrKey: string) {
  return adminApiJson<{ template: Record<string, unknown> }>(
    `/api/admin/visual-templates/${encodeURIComponent(idOrKey)}/archive`,
    { method: 'POST', body: '{}' }
  );
}

export async function activateAdminVisualTemplate(idOrKey: string) {
  return adminApiJson<{ template: Record<string, unknown> }>(
    `/api/admin/visual-templates/${encodeURIComponent(idOrKey)}/activate`,
    { method: 'POST', body: '{}' }
  );
}

export async function syncAdminVisualTemplates(dryRun = false) {
  return adminApiJson<Record<string, unknown>>('/api/admin/visual-templates/sync', {
    method: 'POST',
    body: JSON.stringify({ dryRun }),
  });
}

export async function getAdminVisualTemplateDrift() {
  return adminApiJson<AdminVisualCatalogDrift>('/api/admin/visual-templates/drift');
}

export async function listAdminMusic(filters: AdminMusicFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
  if (filters.isArchived !== undefined) params.set('isArchived', String(filters.isArchived));
  const query = params.toString();
  return adminApiJson<AdminMusicTrack[]>(`/api/admin/music${query ? `?${query}` : ''}`);
}

export async function getAdminMusicSummary() {
  return adminApiJson<AdminMusicSummary>('/api/admin/music/summary');
}

export async function presignAdminMusic(payload: PresignAdminMusicInput) {
  const response = await adminApiFetch('/api/admin/music/presign', { method: 'POST', body: JSON.stringify(payload) });
  return parseJsonOrThrow<{
    uploadUrl: string;
    objectKey: string;
    publicUrl: string;
    headers?: Record<string, string>;
    expiresIn: number;
  }>(response);
}

export async function confirmAdminMusic(payload: ConfirmAdminMusicInput) {
  return adminApiJson<AdminMusicTrack>('/api/admin/music/confirm', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAdminMusic(trackId: string, payload: UpdateAdminMusicInput) {
  return adminApiJson<AdminMusicTrack>(`/api/admin/music/${encodeURIComponent(trackId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function archiveAdminMusic(trackId: string) {
  return adminApiJson<AdminMusicTrack>(
    `/api/admin/music/${encodeURIComponent(trackId)}/archive`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

export async function deleteAdminMusic(trackId: string) {
  return adminApiJson<AdminMusicTrack>(`/api/admin/music/${encodeURIComponent(trackId)}`, {
    method: 'DELETE',
  });
}

export async function getAdminMusicUsage(trackId: string) {
  return adminApiJson<{ count: number; invitationIds: string[] }>(
    `/api/admin/music/${encodeURIComponent(trackId)}/usage`
  );
}

export async function listAdminTemplates(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminApiJson<TemplateDefinition[]>(`/api/admin/templates${query}`);
}

export async function getAdminTemplate(templateId: string) {
  return adminApiJson<TemplateDefinition>(`/api/admin/templates/${templateId}`);
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
  return adminApiJson<AdminTemplatePreviewBundle>(`/api/templates/${encoded}/preview${query}`);
}

export async function createAdminTemplate(payload: AdminTemplatePayload) {
  return adminApiJson<TemplateDefinition>('/api/admin/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
}

export async function updateAdminTemplate(templateId: string, payload: Partial<AdminTemplatePayload>) {
  return adminApiJson<TemplateDefinition>(`/api/admin/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
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
  return adminApiJson<TemplateDefinition>(`/api/admin/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
}

export async function disableAdminTemplate(templateId: string) {
  return adminApiJson<TemplateDefinition>(`/api/admin/templates/${templateId}/disable`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
}

export async function deleteAdminTemplate(templateId: string) {
  return adminApiJson<TemplateDefinition>(`/api/admin/templates/${templateId}/delete`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
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
  return adminApiJson<AdminInvitationGuestList>(`/api/rsvp/${invitationId}${query ? `?${query}` : ''}`);
}

export async function exportAdminInvitationGuestCsv(invitationId: string) {
  const response = await adminApiFetch(`/api/admin/invitations/${invitationId}/rsvp/export`, {
      method: 'GET',
      headers: {},
    });

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
  return adminApiJson<{ success: true }>(`/api/admin/rsvp/${rsvpId}`, {
      method: 'DELETE',
    });
}

export async function updateAdminRsvpVisibility(rsvpId: string, isHidden: boolean) {
  return adminApiJson<{
    success: true;
    rsvp: AdminInvitationGuest & { invitationId: string };
  }>(`/api/admin/rsvp/${rsvpId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isHidden }),
    });
}

export async function getInvitationAnalytics(invitationId: string) {
  return adminApiJson<InvitationAnalyticsSummary>(`/api/admin/invitations/${invitationId}/analytics`);
}

export async function listAdminTemplateSubmissions() {
  return adminApiJson<AdminTemplateSubmission[]>('/api/admin/template-submissions');
}

export async function getAdminTemplateSubmission(submissionId: string) {
  return adminApiJson<AdminTemplateSubmission>(`/api/admin/template-submissions/${submissionId}`);
}

export async function approveAdminTemplateSubmission(
  submissionId: string,
  payload?: { reviewNote?: string; creatorShare?: number }
) {
  return adminApiJson<AdminTemplateSubmission>(`/api/admin/template-submissions/${submissionId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
}

export async function rejectAdminTemplateSubmission(submissionId: string, payload?: { reviewNote?: string }) {
  return adminApiJson<AdminTemplateSubmission>(`/api/admin/template-submissions/${submissionId}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
}
