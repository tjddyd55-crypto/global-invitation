import 'server-only';
import { cache } from 'react';
import { requestSharedInvitation, type SharedInvitationApiPayload } from '@/src/lib/server/shareInvitationFetch';

export type { SharedInvitationApiPayload };

/** layout·메타: 동일 slug당 React cache로 요청 묶기 + 짧은 revalidate */
export const fetchSharedInvitationCached = cache(async (shareSlug: string): Promise<SharedInvitationApiPayload | null> => {
  return requestSharedInvitation(shareSlug, 'revalidate120');
});
