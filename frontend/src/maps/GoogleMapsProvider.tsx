'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { hasGoogleMapsApiKey } from './config';
import { loadGoogleMaps } from './loadGoogleMaps';

type GoogleMapsContextValue = {
  ready: boolean;
  loading: boolean;
  error: string | null;
  maps: typeof google.maps | null;
  hasApiKey: boolean;
  reload: () => void;
};

const GoogleMapsContext = createContext<GoogleMapsContextValue | null>(null);

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const hasApiKey = hasGoogleMapsApiKey();
  const [maps, setMaps] = useState<typeof google.maps | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!hasApiKey) {
      setMaps(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadGoogleMaps()
      .then((api) => {
        if (cancelled) return;
        setMaps(api);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMaps(null);
        setLoading(false);
        setError(err instanceof Error ? err.message : '지도를 불러오지 못했습니다.');
      });

    return () => {
      cancelled = true;
    };
  }, [hasApiKey, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  const value = useMemo<GoogleMapsContextValue>(
    () => ({
      ready: Boolean(maps),
      loading,
      error,
      maps,
      hasApiKey,
      reload,
    }),
    [maps, loading, error, hasApiKey, reload]
  );

  return <GoogleMapsContext.Provider value={value}>{children}</GoogleMapsContext.Provider>;
}

export function useGoogleMaps(): GoogleMapsContextValue {
  const ctx = useContext(GoogleMapsContext);
  if (!ctx) {
    throw new Error('useGoogleMaps는 GoogleMapsProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}

/** Provider 밖에서도 안전하게 상태 조회 (optional) */
export function useGoogleMapsOptional(): GoogleMapsContextValue | null {
  return useContext(GoogleMapsContext);
}
