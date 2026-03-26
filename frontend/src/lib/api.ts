import type { Invitation } from '@/src/models/invitation';
import { buildAuthHeaders, ensureGuestToken } from '@/src/lib/auth';
import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';
import { syncGuestTokenFromResponse } from '@/src/lib/guestToken';

export type { Invitation };

export interface CreateInvitationResponse {
  id: string;
  slug: string;
  shareSlug?: string | null;
  status: string;
  canShare: boolean;
  createdAt: string;
}

export interface GuestInvitationCreateResponse {
  id: string;
  guest_token: string;
  editor_url: string;
}

export interface PublishInvitationResponse {
  share_url: string;
  shareSlug: string;
}

export interface TemplateCloneResponse {
  editor_url: string;
  guest_token?: string | null;
  invitation_id?: string;
  template_version_id?: string | null;
  template_key?: string;
}

export interface InvitationSummary {
  id: string;
  slug: string;
  shareSlug?: string | null;
  title: string | null;
  templateKey: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

// Create invitation
export async function createInvitation(templateKey?: string, guestToken?: string): Promise<CreateInvitationResponse> {
  try {
    const gt = guestToken || ensureGuestToken();
    const response = await fetch(
      buildApiUrl('/api/invitations'),
      buildRequestInit({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(),
        },
        body: templateKey ? JSON.stringify({ templateKey, guestToken: gt }) : JSON.stringify({ guestToken: gt }),
      })
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to create invitation: ${response.status} ${errorText}`);
    }

    syncGuestTokenFromResponse(response);
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('諛깆뿏???쒕쾭???곌껐?????놁뒿?덈떎. ?쒕쾭媛 ?ㅽ뻾 以묒씤吏 ?뺤씤?섏꽭??');
    }
    throw error;
  }
}

// Get invitation by slug
export async function getInvitation(slug: string): Promise<Invitation> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(slug)}`),
    buildRequestInit({
      headers: buildAuthHeaders(),
    })
  );

  if (response.status === 404) {
    throw new Error('Invitation not found');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch invitation');
  }

  return response.json();
}

// Update invitation
export async function updateInvitation(
  slug: string,
  data: {
    title?: string;
    eventDate?: string;
    locationText?: string;
    message?: string;
    templateKey?: string;
    musicKey?: string | null;
    status?: string;
  }
): Promise<Invitation> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(slug)}`),
    buildRequestInit({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify(data),
    })
  );

  if (response.status === 404) {
    throw new Error('Invitation not found');
  }

  if (!response.ok) {
    throw new Error('Failed to update invitation');
  }

  return response.json();
}

export async function listMyInvitations(): Promise<InvitationSummary[]> {
  const response = await fetch(
    buildApiUrl('/api/invitations?owner=me'),
    buildRequestInit({
      headers: buildAuthHeaders(),
    })
  );

  if (response.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch invitations');
  }
  return response.json();
}

export async function listGuestInvitations(guestToken: string): Promise<InvitationSummary[]> {
  const response = await fetch(
    buildApiUrl(`/api/invitations?guestToken=${encodeURIComponent(guestToken)}&status=draft&limit=20`),
    buildRequestInit({})
  );

  if (!response.ok) {
    throw new Error('Failed to fetch guest invitations');
  }
  return response.json();
}

export async function createGuestInvitation(templateId?: string): Promise<GuestInvitationCreateResponse> {
  const response = await fetch(
    buildApiUrl('/api/invitations/guest'),
    buildRequestInit({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify(templateId ? { templateId } : {}),
    })
  );

  if (!response.ok) {
    throw new Error('Failed to create guest invitation');
  }
  syncGuestTokenFromResponse(response);
  return response.json();
}

export async function cloneTemplateInvitation(templateId: string): Promise<TemplateCloneResponse> {
  const response = await fetch(
    buildApiUrl(`/api/templates/${encodeURIComponent(templateId)}/clone`),
    buildRequestInit({
      method: 'POST',
      headers: {
        ...buildAuthHeaders(),
      },
    })
  );

  if (!response.ok) {
    throw new Error('Failed to clone template');
  }
  syncGuestTokenFromResponse(response);
  return response.json();
}

export async function trackTemplateView(templateId: string): Promise<void> {
  try {
    await fetch(
      buildApiUrl(`/api/templates/${encodeURIComponent(templateId)}/view`),
      buildRequestInit({
        method: 'POST',
        headers: {
          ...buildAuthHeaders(),
        },
        keepalive: true,
      })
    );
  } catch {
    // Analytics failure should not block template browsing.
  }
}

export async function getInvitationForEditor(identifier: string, token?: string | null): Promise<Invitation> {
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(identifier)}${query}`),
    buildRequestInit({
      headers: buildAuthHeaders(),
    })
  );

  if (response.status === 403) {
    throw new Error('FORBIDDEN');
  }
  if (response.status === 404) {
    throw new Error('Invitation not found');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch invitation');
  }
  return response.json();
}

export async function saveInvitationDraftById(
  id: string,
  payload: Record<string, unknown>,
  token?: string | null
): Promise<Invitation> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(id)}`),
    buildRequestInit({
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({
        ...payload,
        token: token || undefined,
      }),
    })
  );

  if (response.status === 403) {
    throw new Error('FORBIDDEN');
  }
  if (!response.ok) {
    throw new Error('Failed to save invitation draft');
  }
  return response.json();
}

export async function publishInvitationById(id: string, token?: string | null): Promise<PublishInvitationResponse> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(id)}/publish`),
    buildRequestInit({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({
        token: token || undefined,
      }),
    })
  );

  if (response.status === 403) {
    throw new Error('FORBIDDEN');
  }
  if (!response.ok) {
    throw new Error('Failed to publish invitation');
  }
  return response.json();
}

export async function getSharedInvitationBySlug(shareSlug: string): Promise<Invitation & { shareUrl?: string }> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/share/${encodeURIComponent(shareSlug)}`),
    buildRequestInit({
      cache: 'no-store',
    })
  );
  if (response.status === 404) {
    throw new Error('Invitation not found');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch shared invitation');
  }
  return response.json();
}

export type TemplateSearchHit = {
  id: string;
  slug: string;
  name: string;
  description: string;
  templateKey: string;
};

export async function fetchTemplateSearchSuggestions(query: string): Promise<TemplateSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const response = await fetch(
    buildApiUrl(`/api/templates/search?q=${encodeURIComponent(q)}`),
    buildRequestInit({ cache: 'no-store' })
  );
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as TemplateSearchHit[]) : [];
}

export type HubNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function fetchHubNotifications(): Promise<HubNotification[]> {
  const response = await fetch(
    buildApiUrl('/api/notifications'),
    buildRequestInit({
      headers: buildAuthHeaders(),
      cache: 'no-store',
    })
  );
  if (response.status === 401) {
    return [];
  }
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as HubNotification[]) : [];
}

export async function markHubNotificationRead(notificationId: string): Promise<boolean> {
  const response = await fetch(
    buildApiUrl(`/api/notifications/${encodeURIComponent(notificationId)}/read`),
    buildRequestInit({
      method: 'PATCH',
      headers: buildAuthHeaders(),
      cache: 'no-store',
    })
  );
  return response.ok;
}

export async function markAllHubNotificationsRead(): Promise<boolean> {
  const response = await fetch(
    buildApiUrl('/api/notifications/read-all'),
    buildRequestInit({
      method: 'PATCH',
      headers: buildAuthHeaders(),
      cache: 'no-store',
    })
  );
  return response.ok;
}

export async function fetchRecentInvitationsForHub(): Promise<InvitationSummary[]> {
  const response = await fetch(
    buildApiUrl('/api/invitations/recent'),
    buildRequestInit({
      headers: buildAuthHeaders(),
      cache: 'no-store',
    })
  );
  if (response.status === 401) {
    return [];
  }
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as InvitationSummary[]) : [];
}
