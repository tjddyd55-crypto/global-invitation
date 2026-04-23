'use client';

import { useEffect } from 'react';

/**
 * 모바일 PWA 쉘에서만 서비스워커를 등록한다.
 * - SSR/비-브라우저 환경 가드 포함.
 * - 개발(`NODE_ENV !== 'production'`)에서는 등록하지 않는다 (HMR 혼선 방지).
 */
export function useServiceWorker(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          // 등록 실패는 silent — 앱이 온라인 환경에서는 문제 없이 동작한다.
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);
}
