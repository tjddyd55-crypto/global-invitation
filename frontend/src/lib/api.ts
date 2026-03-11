import type { Invitation } from '@/src/models/invitation';
import { buildAuthHeaders, getGuestToken } from '@/src/lib/auth';
import { buildApiUrl } from '@/src/lib/apiBase';

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
    const response = await fetch(buildApiUrl('/api/invitations'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: templateKey
        ? JSON.stringify({ templateKey, guestToken: guestToken || getGuestToken() })
        : JSON.stringify({ guestToken: guestToken || getGuestToken() }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to create invitation: ${response.status} ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
    }
    throw error;
  }
}

// Get invitation by slug
export async function getInvitation(slug: string): Promise<Invitation> {
  const response = await fetch(buildApiUrl(`/api/invitations/${encodeURIComponent(slug)}`), {
    credentials: 'include',
    headers: buildAuthHeaders(),
  });

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
  const response = await fetch(buildApiUrl(`/api/invitations/${encodeURIComponent(slug)}`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (response.status === 404) {
    throw new Error('Invitation not found');
  }

  if (!response.ok) {
    throw new Error('Failed to update invitation');
  }

  return response.json();
}

export async function listMyInvitations(): Promise<InvitationSummary[]> {
  const response = await fetch(buildApiUrl('/api/invitations?owner=me'), {
    credentials: 'include',
    headers: buildAuthHeaders(),
  });

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
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch guest invitations');
  }
  return response.json();
}

export async function createGuestInvitation(templateId?: string): Promise<GuestInvitationCreateResponse> {
  const response = await fetch(buildApiUrl('/api/invitations/guest'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(templateId ? { templateId } : {}),
  });

  if (!response.ok) {
    throw new Error('Failed to create guest invitation');
  }
  return response.json();
}

export async function cloneTemplateInvitation(templateId: string): Promise<TemplateCloneResponse> {
  const response = await fetch(buildApiUrl(`/api/templates/${encodeURIComponent(templateId)}/clone`), {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to clone template');
  }
  return response.json();
}

export async function getInvitationForEditor(identifier: string, token?: string | null): Promise<Invitation> {
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  const response = await fetch(buildApiUrl(`/api/invitations/${encodeURIComponent(identifier)}${query}`), {
    credentials: 'include',
    headers: buildAuthHeaders(),
  });

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
  const response = await fetch(buildApiUrl(`/api/invitations/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({
      ...payload,
      token: token || undefined,
    }),
  });

  if (response.status === 403) {
    throw new Error('FORBIDDEN');
  }
  if (!response.ok) {
    throw new Error('Failed to save invitation draft');
  }
  return response.json();
}

export async function publishInvitationById(id: string, token?: string | null): Promise<PublishInvitationResponse> {
  const response = await fetch(buildApiUrl(`/api/invitations/${encodeURIComponent(id)}/publish`), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({
      token: token || undefined,
    }),
  });

  if (response.status === 403) {
    throw new Error('FORBIDDEN');
  }
  if (!response.ok) {
    throw new Error('Failed to publish invitation');
  }
  return response.json();
}

export async function getSharedInvitationBySlug(shareSlug: string): Promise<Invitation & { shareUrl?: string }> {
  const response = await fetch(buildApiUrl(`/api/invitations/share/${encodeURIComponent(shareSlug)}`), {
    cache: 'no-store',
  });
  if (response.status === 404) {
    throw new Error('Invitation not found');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch shared invitation');
  }
  return response.json();
}
