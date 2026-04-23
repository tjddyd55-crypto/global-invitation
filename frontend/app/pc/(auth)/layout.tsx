import type { ReactNode } from 'react';

/**
 * 비로그인 전용 레이아웃 (PC).
 * - 사이드바/헤더 없이 최소 배경만 제공한다.
 * - 로그인·회원가입처럼 "인증 전" 화면이 대상.
 */
export default function PcAuthLayout({ children }: { children: ReactNode }) {
  return <div style={{ minHeight: '100vh', background: '#f5f6f8' }}>{children}</div>;
}
