'use client';

import { useSyncExternalStore } from 'react';
import {
  resolveViewportPlatformFromWidth,
  VIEWPORT_DESKTOP_MEDIA,
  type ViewportPlatform,
} from './viewportBreakpoint';

/**
 * Hydration-safe viewport platform.
 *
 * - SSR / hydration 첫 페인트: `null` (중립 skeleton)
 * - hydration 이후: matchMedia 기준 mobile | desktop
 * - 리사이즈 시 즉시 갱신 (데이터 유실 없음 — 호출부 state 유지)
 *
 * React #418/#423 방지: getServerSnapshot 과 hydration 초기값이 동일하게 null.
 */
export function useViewportPlatform(): ViewportPlatform | null {
  return useSyncExternalStore(subscribeViewport, getClientSnapshot, getServerSnapshot);
}

function getServerSnapshot(): ViewportPlatform | null {
  return null;
}

function getClientSnapshot(): ViewportPlatform | null {
  if (typeof window === 'undefined') return null;
  return resolveViewportPlatformFromWidth(window.innerWidth);
}

function subscribeViewport(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const mql = window.matchMedia(VIEWPORT_DESKTOP_MEDIA);
  const handler = () => onStoreChange();

  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', handler);
  } else {
    mql.addListener(handler);
  }

  window.addEventListener('resize', handler);

  return () => {
    if (typeof mql.removeEventListener === 'function') {
      mql.removeEventListener('change', handler);
    } else {
      mql.removeListener(handler);
    }
    window.removeEventListener('resize', handler);
  };
}
