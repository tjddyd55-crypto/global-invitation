/**
 * Auth status SSOT — 페이지별 임의 판정 금지.
 * session 조회 중 → loading
 * 유효 세션 → authenticated
 * 401/없음/만료 → unauthenticated
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function isAuthenticatedStatus(status: AuthStatus): boolean {
  return status === 'authenticated';
}

export function isUnauthenticatedStatus(status: AuthStatus): boolean {
  return status === 'unauthenticated';
}
