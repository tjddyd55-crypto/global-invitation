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
  getSessionToken,
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

/**
 * 앱 전역 인증 SSOT. sessionStorage 캐시만으로 authenticated 를 선언하지 않는다.
 * 반드시 /api/auth/me 부트스트랩 결과로 status 를 확정한다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const isInitialBootstrapRef = useRef(true);
  const statusRef = useRef<AuthStatus>('loading');
  statusRef.current = status;

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
    // Admin portal uses /api/admin/me only — do not couple to user /api/auth/me.
    if (isAdminPortalPath(pathname)) {
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    let cancelled = false;
    const bootstrap = async () => {
      try {
        const next = await fetchNavbarUser({ useCache: false });
        if (cancelled) return;
        setUser(next);
        setStatus(next ? 'authenticated' : 'unauthenticated');
      } catch {
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      }
    };

    if (isInitialBootstrapRef.current) {
      isInitialBootstrapRef.current = false;
      setStatus('loading');
      void bootstrap();
      return () => {
        cancelled = true;
      };
    }

    // Stored token can exist while context is still stale after login/signup navigation.
    if (getSessionToken()) {
      if (statusRef.current !== 'authenticated') {
        setStatus('loading');
      }
      void bootstrap();
    }

    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
