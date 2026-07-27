import type { WeddingInvitationData } from '@/src/invitation/schemas';

/** dataJson comments settings — RSVP.message 와 분리 */
export function resolveCommentsEnabled(data: Partial<WeddingInvitationData> | Record<string, unknown> | null | undefined): boolean {
  if (!data || typeof data !== 'object') return true;
  const record = data as Record<string, unknown>;
  if (typeof record.commentsEnabled === 'boolean') return record.commentsEnabled;
  if (typeof record.guestbookEnabled === 'boolean') return record.guestbookEnabled;
  return true;
}

export function resolveCommentsTitle(
  data: Partial<WeddingInvitationData> | Record<string, unknown> | null | undefined,
  fallback: string
): string {
  if (!data || typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  const title = typeof record.commentsTitle === 'string' ? record.commentsTitle.trim() : '';
  if (title) return title;
  const messagesTitle = typeof record.messagesTitle === 'string' ? record.messagesTitle.trim() : '';
  return messagesTitle || fallback;
}
