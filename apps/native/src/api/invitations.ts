import { apiRequest } from '@/src/api/client';

export type ConceptType = 'WEDDING' | 'FUNERAL' | 'GENERAL' | 'ORGANIZATION';

export type InvitationSummary = {
  id: string;
  slug: string;
  shareSlug?: string | null;
  title: string | null;
  templateKey: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};

export type InvitationDetail = InvitationSummary & {
  dataJson?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
  isOwner?: boolean;
  isPaid?: boolean;
  canShare?: boolean;
  language?: string | null;
  shareSlug?: string | null;
};

export async function listMyInvitations(): Promise<InvitationSummary[]> {
  return apiRequest<InvitationSummary[]>('/api/invitations?owner=me');
}

export async function listRecentInvitations(): Promise<InvitationSummary[]> {
  return apiRequest<InvitationSummary[]>('/api/invitations/recent');
}

export async function getInvitation(id: string): Promise<InvitationDetail> {
  return apiRequest<InvitationDetail>(`/api/invitations/${id}`);
}

export async function createInvitation(input: {
  conceptType: ConceptType;
  visualTemplateId: string;
  locale?: string;
}): Promise<{ id: string; slug: string; status: string }> {
  return apiRequest('/api/invitations', {
    method: 'POST',
    body: {
      templateKey: 'invitation_full',
      conceptType: input.conceptType,
      visualTemplateId: input.visualTemplateId,
      locale: input.locale ?? 'ko-KR',
    },
  });
}

export async function patchInvitation(
  id: string,
  dataJson: Record<string, unknown>,
): Promise<unknown> {
  return apiRequest(`/api/invitations/${id}`, {
    method: 'PATCH',
    body: { data_json: dataJson },
  });
}

export async function requestOwnerPreviewToken(
  id: string,
): Promise<{ token: string }> {
  return apiRequest<{ token: string }>(`/api/invitations/${id}/owner-preview-token`, {
    method: 'POST',
  });
}
