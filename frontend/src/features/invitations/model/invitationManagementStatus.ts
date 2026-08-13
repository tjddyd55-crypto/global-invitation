import type { InvitationSummary } from '@/src/shared/api';

export type InvitationManagementStatus = 'EDITING' | 'SHARING' | 'EXPIRED';

export const INVITATION_MANAGEMENT_TABS: Array<{
  id: InvitationManagementStatus;
  label: string;
}> = [
  { id: 'EDITING', label: '수정중' },
  { id: 'SHARING', label: '공유중' },
  { id: 'EXPIRED', label: '기간종료' },
];

export type InvitationManagementGroups = {
  EDITING: InvitationSummary[];
  SHARING: InvitationSummary[];
  EXPIRED: InvitationSummary[];
};

export type InvitationManagementCounts = {
  EDITING: number;
  SHARING: number;
  EXPIRED: number;
};

/**
 * `/my-invitations` 관리 상태.
 * DB InvitationStatus(DRAFT|SHARED|PUBLISHED)만 사용한다.
 * eventDate / 결제 여부로 EXPIRED·수정중을 만들지 않는다.
 */
export function resolveInvitationManagementStatus(invitation: {
  status?: string | null;
}): InvitationManagementStatus {
  const status = (invitation.status || '').trim().toUpperCase();
  if (status === 'PUBLISHED') return 'SHARING';
  return 'EDITING';
}

export function groupInvitationsByManagementStatus(
  items: InvitationSummary[]
): InvitationManagementGroups {
  const groups: InvitationManagementGroups = {
    EDITING: [],
    SHARING: [],
    EXPIRED: [],
  };
  for (const item of items) {
    groups[resolveInvitationManagementStatus(item)].push(item);
  }
  return groups;
}

export function countInvitationsByManagementStatus(
  items: InvitationSummary[]
): InvitationManagementCounts {
  const groups = groupInvitationsByManagementStatus(items);
  return {
    EDITING: groups.EDITING.length,
    SHARING: groups.SHARING.length,
    EXPIRED: groups.EXPIRED.length,
  };
}

export function invitationDisplayTitle(title: string | null | undefined): string {
  const trimmed = title?.trim();
  return trimmed || '제목 없음';
}

export function formatInvitationDotDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function invitationCardMeta(
  item: InvitationSummary,
  status: InvitationManagementStatus
): string {
  if (status === 'SHARING') {
    const published = formatInvitationDotDate(item.publishedAt || item.updatedAt);
    return published ? `${published} 발행` : '';
  }
  const updated = formatInvitationDotDate(item.updatedAt);
  return updated ? `최근 수정 ${updated}` : '';
}
