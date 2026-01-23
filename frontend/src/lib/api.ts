const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set.');
  }
  return API_BASE_URL;
}

export interface Invitation {
  id: string;
  slug: string;
  title?: string | null;
  eventDate?: string | null;
  locationText?: string | null;
  message?: string | null;
  templateKey: string;
  musicKey?: string | null;
  countryCode: string;
  language: string;
  status: string;
  isPaid: boolean;
  canShare: boolean;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationResponse {
  id: string;
  slug: string;
  status: string;
  canShare: boolean;
  createdAt: string;
}

// Create invitation
export async function createInvitation(templateKey?: string): Promise<CreateInvitationResponse> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: templateKey ? JSON.stringify({ templateKey }) : undefined,
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
  const response = await fetch(`${getApiBaseUrl()}/api/invitations/${slug}`);

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
  }
): Promise<Invitation> {
  const response = await fetch(`${getApiBaseUrl()}/api/invitations/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
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
