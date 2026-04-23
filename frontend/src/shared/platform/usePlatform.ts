'use client';

import { useEffect, useState } from 'react';
import { detectPlatformFromUA, normalizePlatformPref, UI_PREF_COOKIE, type Platform } from './detect';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=').slice(1).join('='));
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
}

/**
 * 클라이언트에서 플랫폼 힌트를 읽는 훅.
 * - 초기값은 UA + 쿠키로 바로 결정하여 SSR flash 를 최소화.
 * - setPreferredPlatform 으로 쿠키를 덮어쓰면 다음 내비게이션부터 middleware 가 이를 반영한다.
 */
export function usePlatform(): {
  platform: Platform;
  setPreferredPlatform: (next: Platform) => void;
} {
  const [platform, setPlatform] = useState<Platform>(() => resolveInitial());

  useEffect(() => {
    setPlatform(resolveInitial());
  }, []);

  const setPreferredPlatform = (next: Platform) => {
    writeCookie(UI_PREF_COOKIE, next);
    setPlatform(next);
  };

  return { platform, setPreferredPlatform };
}

function resolveInitial(): Platform {
  const override = normalizePlatformPref(readCookie(UI_PREF_COOKIE));
  if (override) return override;
  if (typeof navigator === 'undefined') return 'desktop';
  return detectPlatformFromUA(navigator.userAgent);
}
