'use client';

/* eslint-disable i18next/no-literal-string */

import type { ReactNode } from 'react';
import { useViewportPlatform } from './useViewportPlatform';

type Props = {
  mobile: ReactNode;
  desktop: ReactNode;
  /** SSR·hydration 구간 중립 UI. 기본은 최소 skeleton. */
  fallback?: ReactNode;
};

function DefaultViewportFallback() {
  return (
    <div
      data-testid="viewport-shell-fallback"
      style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6B7280',
        fontSize: 14,
        background: '#F7F3EC',
      }}
    >
      화면 준비 중…
    </div>
  );
}

/**
 * Canonical route용 hydration-safe Mobile/Desktop shell 경계.
 * /m · /pc QA 경로에서는 사용하지 않는다 (경로 고정 셸 유지).
 */
export default function ResponsivePlatformBoundary({
  mobile,
  desktop,
  fallback,
}: Props) {
  const platform = useViewportPlatform();

  if (platform === null) {
    return <>{fallback ?? <DefaultViewportFallback />}</>;
  }

  return <>{platform === 'mobile' ? mobile : desktop}</>;
}
