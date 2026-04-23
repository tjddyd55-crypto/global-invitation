import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Global Invitation — Mobile',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Global Invitation',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 1,
};

/**
 * 모바일 공통 레이아웃 (얇음).
 * 실제 쉘(바텀네비)은 `(app)` 그룹에서, 인증 풀스크린은 `(auth)` 그룹에서 적용한다.
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
