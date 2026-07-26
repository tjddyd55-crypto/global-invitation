'use client';

import { usePathname } from 'next/navigation';

/**
 * 에디터 셸 분기 (hydration-safe).
 * - /m/* → 항상 mobile (viewport로 교체 금지)
 * - /pc/* → 항상 desktop
 * - /editor/* redirect 대기 구간에서는 호출되지 않거나, desktop으로 고정하지 않고 mobile 안전 기본값
 *
 * viewport matchMedia / useSyncExternalStore 사용 금지 — SSR·CSR DOM이 달라지면 #418/#423 발생.
 */
export function useEditorShell(): 'mobile' | 'desktop' {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/m')) return 'mobile';
  if (pathname.startsWith('/pc')) return 'desktop';

  // bare /editor 는 페이지에서 redirect pending UI만 보여야 한다.
  // 만약 WeddingEditor가 잠깐 마운트되면 mobile로 고정해 DOM 플립을 막는다.
  return 'mobile';
}
