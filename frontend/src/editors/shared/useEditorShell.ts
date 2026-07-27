'use client';

import { usePathname } from 'next/navigation';
import { useViewportPlatform } from '@/src/shared/platform/useViewportPlatform';
import type { ViewportPlatform } from '@/src/shared/platform/viewportBreakpoint';

/**
 * 에디터 셸 분기 (hydration-safe).
 *
 * - /m/* → 항상 mobile (viewport로 교체 금지, QA용)
 * - /pc/* → 항상 desktop (QA용)
 * - /editor/* canonical → viewport (1024) 기준, mount 전 null
 *
 * null 일 때 WeddingEditor 는 skeleton 만 렌더해 SSR/CSR DOM 을 일치시킨다.
 */
export function useEditorShell(): ViewportPlatform | null {
  const pathname = usePathname() ?? '';
  const viewport = useViewportPlatform();

  if (pathname === '/m' || pathname.startsWith('/m/')) return 'mobile';
  if (pathname === '/pc' || pathname.startsWith('/pc/')) return 'desktop';

  return viewport;
}
