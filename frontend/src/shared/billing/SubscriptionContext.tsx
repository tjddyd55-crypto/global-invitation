'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_SUBSCRIPTION, type Subscription } from './subscription';
import { fetchSubscription } from './subscriptionApi';
import { getSessionToken } from '@/src/lib/auth';

interface SubscriptionContextValue {
  subscription: Subscription;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

/**
 * 앱 전역에서 구독 상태를 제공한다.
 * - 비로그인 상태에서는 API 호출을 건너뛰고 기본값(FREE)을 유지한다.
 * - 토큰이 나중에 세팅되면 자동으로 한 번 refresh 한다.
 */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription>(DEFAULT_SUBSCRIPTION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasFetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!getSessionToken()) {
      setSubscription(DEFAULT_SUBSCRIPTION);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await fetchSubscription();
      setSubscription(next);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('SUBSCRIPTION_FETCH_FAILED'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void refresh();
  }, [refresh]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({ subscription, loading, error, refresh }),
    [subscription, loading, error, refresh],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within <SubscriptionProvider>');
  }
  return ctx;
}
