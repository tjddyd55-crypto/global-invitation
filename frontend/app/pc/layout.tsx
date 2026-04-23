import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Global Invitation — Desktop',
};

/**
 * PC 공통 레이아웃 (얇음).
 * 실제 쉘(사이드바)은 `(app)` 그룹, 인증 페이지는 `(auth)` 그룹에서 각자 적용한다.
 */
export default function PcLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
