import { buildApiUrl } from '@/src/lib/apiBase';
import type { SupportedTemplateKey, TemplateDefinition } from '@/src/templates/registry';

export type AdminSession = {
  authenticated: true;
  adminId: string;
  expiresAt: number;
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
  createdAt: string;
};

export type AdminInvitationGuestList = {
  invitation: {
    id: string;
    slug: string;
    title?: string | null;
  };
  totalGuests: number;
  attending: number;
  declined: number;
  maybe: number;
  guests: AdminInvitationGuest[];
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

function buildAdminRequestInit(init?: RequestInit): RequestInit {
  return {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  };
}

export async function loginAdmin(adminId: string, password: string) {
  const response = await fetch(
    buildApiUrl('/api/admin/login'),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify({ id: adminId, password }),
    })
  );
  return parseJsonOrThrow<{ authenticated: true; adminId: string }>(response);
}

export async function logoutAdmin() {
  const response = await fetch(
    buildApiUrl('/api/admin/logout'),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify({}),
    })
  );
  return parseJsonOrThrow<{ success: true }>(response);
}

export async function getAdminSession() {
  const response = await fetch(buildApiUrl('/api/admin/me'), buildAdminRequestInit());
  return parseJsonOrThrow<AdminSession>(response);
}

export async function getAdminDashboardSummary() {
  const response = await fetch(buildApiUrl('/api/admin/dashboard'), buildAdminRequestInit());
  return parseJsonOrThrow<AdminDashboardSummary>(response);
}

export async function listAdminTemplates() {
  const response = await fetch(buildApiUrl('/api/admin/templates'), buildAdminRequestInit());
  return parseJsonOrThrow<TemplateDefinition[]>(response);
}

export async function getAdminTemplate(templateId: string) {
  const response = await fetch(buildApiUrl(`/api/admin/templates/${templateId}`), buildAdminRequestInit());
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function createAdminTemplate(payload: AdminTemplatePayload) {
  const response = await fetch(
    buildApiUrl('/api/admin/templates'),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify(payload),
    })
  );
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function updateAdminTemplate(templateId: string, payload: Partial<AdminTemplatePayload>) {
  const response = await fetch(
    buildApiUrl(`/api/admin/templates/${templateId}`),
    buildAdminRequestInit({
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  );
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function disableAdminTemplate(templateId: string) {
  const response = await fetch(
    buildApiUrl(`/api/admin/templates/${templateId}/disable`),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify({}),
    })
  );
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function deleteAdminTemplate(templateId: string) {
  const response = await fetch(
    buildApiUrl(`/api/admin/templates/${templateId}/delete`),
    buildAdminRequestInit({
      method: 'POST',
      body: JSON.stringify({}),
    })
  );
  return parseJsonOrThrow<TemplateDefinition>(response);
}

export async function getAdminInvitationGuestList(invitationId: string) {
  const response = await fetch(buildApiUrl(`/api/rsvp/${invitationId}`), buildAdminRequestInit());
  return parseJsonOrThrow<AdminInvitationGuestList>(response);
}
