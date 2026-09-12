import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '@/src/api/client';
import { fetchMe } from '@/src/api/auth';
import { persistToken, useAuthStore } from '@/src/stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

type Props = {
  children: ReactNode;
  onUnauthorized?: () => void;
};

export function AppProviders({ children, onUnauthorized }: Props) {
  const [ready, setReady] = useState(false);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
      onUnauthorized?.();
    });
  }, [onUnauthorized]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await bootstrap();
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const user = await fetchMe();
        if (!cancelled) {
          setSession(currentToken, user);
        }
      } catch {
        await clearSession();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrap, clearSession, setSession]);

  useEffect(() => {
    if (token) {
      persistToken(token).catch(() => undefined);
    }
  }, [token]);

  if (!ready) return null;

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { queryClient };
