'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearStoredSession,
  fetchNavbarUser,
  getCachedNavbarUserSnapshot,
  logoutCurrentSession,
  type AuthUser,
} from '@/src/lib/auth';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface UseAuthResult {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Navbar/가드/대시보드에서 공용으로 쓰는 인증 훅.
 * - 초기값은 sessionStorage 캐시에서 즉시 가져와 깜빡임을 제거한다.
 * - 서버 호출은 최초 mount 에서 한 번, 그리고 refresh() 수동 호출 시.
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(() => readSnapshot());
  const [status, setStatus] = useState<AuthStatus>(() => (readSnapshot() ? 'authenticated' : 'loading'));
  const hasBootstrappedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchNavbarUser({ useCache: false });
      setUser(next);
      setStatus(next ? 'authenticated' : 'anonymous');
    } catch {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await logoutCurrentSession();
    clearStoredSession();
    setUser(null);
    setStatus('anonymous');
  }, []);

  return { user, status, refresh, signOut };
}

function readSnapshot(): AuthUser | null {
  const snapshot = getCachedNavbarUserSnapshot();
  return snapshot ?? null;
}
