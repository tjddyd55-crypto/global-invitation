import type { AuthStatus } from './authStatus';
import type { InvitationConceptType } from '@/src/invitation/conceptTypes';

export const CONCEPT_CREATE_PATH = '/create/concept';
export const MY_INVITATIONS_PATH = '/my-invitations';
export const ORGANIZATION_TEMPLATES_PATH = '/create/templates?concept=ORGANIZATION';

/**
 * 「로그인」 진입 경로 SSOT — 비로그인 전용.
 */
export function getLoginEntryPath(): string {
  return `/auth/email?next=${encodeURIComponent(MY_INVITATIONS_PATH)}`;
}

/**
 * 「초대장 만들기」 진입 경로 SSOT.
 * loading 중에는 호출측에서 CTA를 disabled 처리하고, authenticated 전에 concept로 보내지 않는다.
 */
export function getCreateInvitationEntryPath(status: AuthStatus): string {
  if (status === 'authenticated') {
    return CONCEPT_CREATE_PATH;
  }
  return `/auth/email?next=${encodeURIComponent(CONCEPT_CREATE_PATH)}`;
}

/** Home category card → concept flow. ORGANIZATION skips picker into its template catalog. */
export function getConceptCardEntryPath(
  concept: InvitationConceptType,
  status: AuthStatus
): string {
  if (concept === 'ORGANIZATION') {
    return status === 'authenticated'
      ? ORGANIZATION_TEMPLATES_PATH
      : requireAuthenticatedNextPath(ORGANIZATION_TEMPLATES_PATH);
  }
  return getCreateInvitationEntryPath(status);
}

/**
 * 「내 초대장」 진입 경로 SSOT.
 */
export function getMyInvitationsEntryPath(status: AuthStatus): string {
  if (status === 'authenticated') {
    return MY_INVITATIONS_PATH;
  }
  return `/auth/email?next=${encodeURIComponent(MY_INVITATIONS_PATH)}`;
}

export function requireAuthenticatedNextPath(nextPath: string): string {
  const trimmed = nextPath.trim();
  const safe =
    trimmed.startsWith('/') && !trimmed.startsWith('//') ? trimmed : CONCEPT_CREATE_PATH;
  return `/auth/email?next=${encodeURIComponent(safe)}`;
}
