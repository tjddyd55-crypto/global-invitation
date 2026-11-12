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
import { usePathname } from 'next/navigation';
import {
  clearStoredSession,
  fetchNavbarUser,
  logoutCurrentSession,
  type AuthUser,
} from '@/src/lib/auth';
import type { AuthStatus } from './authStatus';

function isAdminPortalPath(pathname: string | null): boolean {
  return Boolean(pathname && (pathname === '/admin' || pathname.startsWith('/admin/')));
}

export interface AuthSessionContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function useAuthBootstrap(pathname: string | null, refresh: () => Promise<void>) {
  const hasBootstrappedRef = useRef(false);
  useEffect(() => {
    if (hasBootstrappedRef.current || isAdminPortalPath(pathname)) return;
    hasBootstrappedRef.current = true;
    void refresh();
  }, [pathname, refresh]);
}

/**
 * 앱 전역 인증 SSOT. sessionStorage 캐시만으로 authenticated 를 선언하지 않는다.
 * 반드시 /api/auth/me 부트스트랩 결과로 status 를 확정한다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(isAdminPortalPath(pathname) ? 'unauthenticated' : 'loading');
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setStatus('loading');
    try {
      const next = await fetchNavbarUser({ useCache: false });
      if (version !== requestVersion.current) return;
      setUser(next);
      setStatus(next ? 'authenticated' : 'unauthenticated');
    } catch {
      if (version !== requestVersion.current) return;
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useAuthBootstrap(pathname, refresh);

  const signOut = useCallback(async () => {
    ++requestVersion.current;
    await logoutCurrentSession();
    ++requestVersion.current;
    clearStoredSession();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(() => ({ user, status, refresh, signOut }), [user, status, refresh, signOut]);

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
