'use client';

import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import {
  EDITOR_VIEWPORT_BREAKPOINT_PX,
  resolveEditorPlatformFromWidth,
} from '@/src/shared/platform/editorViewport';

function subscribeViewport(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const mq = window.matchMedia(`(max-width: ${EDITOR_VIEWPORT_BREAKPOINT_PX}px)`);
  mq.addEventListener('change', onStoreChange);
  window.addEventListener('resize', onStoreChange);
  return () => {
    mq.removeEventListener('change', onStoreChange);
    window.removeEventListener('resize', onStoreChange);
  };
}

function getViewportShell(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return resolveEditorPlatformFromWidth(window.innerWidth);
}

/**
 * 에디터 셸 분기.
 * - /m/* → 항상 mobile (DOM에 desktop 3열 미렌더)
 * - /pc/* → 항상 desktop
 * - /editor 등 → viewport breakpoint
 */
export function useEditorShell(): 'mobile' | 'desktop' {
  const pathname = usePathname() ?? '';
  const viewportShell = useSyncExternalStore(subscribeViewport, getViewportShell, () => 'desktop' as const);

  if (pathname.startsWith('/m')) return 'mobile';
  if (pathname.startsWith('/pc')) return 'desktop';
  return viewportShell;
}
