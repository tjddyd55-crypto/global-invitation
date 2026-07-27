'use client';

import { useAuthSession, type AuthSessionContextValue } from '@/src/shared/auth/AuthProvider';
import type { AuthStatus } from '@/src/shared/auth/authStatus';
import type { AuthUser } from '@/src/lib/auth';

export type { AuthStatus };

export interface UseAuthResult {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * 인증 훅 SSOT — AuthProvider 컨텍스트를 읽는다.
 * 레거시 `anonymous` 문자열은 사용하지 않는다 (`unauthenticated`).
 */
export function useAuth(): UseAuthResult {
  const session: AuthSessionContextValue = useAuthSession();
  return {
    user: session.user,
    status: session.status,
    refresh: session.refresh,
    signOut: session.signOut,
  };
}
