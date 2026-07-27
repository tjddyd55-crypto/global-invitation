'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  clearStoredSession,
  fetchNavbarUser,
  logoutCurrentSession,
  type AuthUser,
} from '@/src/lib/auth';
import type { AuthStatus } from './authStatus';

export interface AuthSessionContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

/**
 * 앱 전역 인증 SSOT. sessionStorage 캐시만으로 authenticated 를 선언하지 않는다.
 * 반드시 /api/auth/me 부트스트랩 결과로 status 를 확정한다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const hasBootstrappedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchNavbarUser({ useCache: false });
      setUser(next);
      setStatus(next ? 'authenticated' : 'unauthenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
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
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      refresh,
      signOut,
    }),
    [user, status, refresh, signOut]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }
  return ctx;
}

export function useAuthStatus(): AuthStatus {
  return useAuthSession().status;
}
