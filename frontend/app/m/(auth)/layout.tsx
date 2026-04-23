import type { ReactNode } from 'react';

/**
 * 비로그인 전용 레이아웃 (모바일).
 * - 바텀네비 없이 풀스크린으로만 노출한다.
 */
export default function MobileAuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
