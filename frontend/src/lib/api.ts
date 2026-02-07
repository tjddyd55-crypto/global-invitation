import type { Invitation } from '@/src/models/invitation';
import { buildAuthHeaders, getGuestToken } from '@/src/lib/auth';
import { buildApiUrl } from '@/src/lib/apiBase';

export type { Invitation };

export interface CreateInvitationResponse {
  id: string;
  slug: string;
  status: string;
  canShare: boolean;
  createdAt: string;
}

export interface InvitationSummary {
  id: string;
  slug: string;
  title: string | null;
  templateKey: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Create invitation
export async function createInvitation(templateKey?: string, guestToken?: string): Promise<CreateInvitationResponse> {
  try {
    const response = await fetch(buildApiUrl('/api/invitations'), {
      method: 'POST',
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
  const response = await fetch(buildApiUrl(`/api/invitations/${slug}`), {
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
  const response = await fetch(buildApiUrl(`/api/invitations/${slug}`), {
    method: 'PUT',
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
    buildApiUrl(`/api/invitations?guestToken=${encodeURIComponent(guestToken)}&status=draft&limit=5`)
  );

  if (!response.ok) {
    throw new Error('Failed to fetch guest invitations');
  }
  return response.json();
}
