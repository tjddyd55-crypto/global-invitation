/**
 * Viewport 반응형 SSOT (Figma Make useIsDesktop 와 동일).
 *
 * - width < 1024 → Mobile UI
 * - width >= 1024 → Desktop UI
 *
 * CSS media query / JS hook / route shell 모두 이 값을 사용한다.
 */
export const VIEWPORT_BREAKPOINT_PX = 1024;

/** @deprecated VIEWPORT_BREAKPOINT_PX 사용. 에디터 전용 별칭 유지. */
export const EDITOR_VIEWPORT_BREAKPOINT_PX = VIEWPORT_BREAKPOINT_PX;

export type ViewportPlatform = 'mobile' | 'desktop';

export function resolveViewportPlatformFromWidth(width: number): ViewportPlatform {
  return width < VIEWPORT_BREAKPOINT_PX ? 'mobile' : 'desktop';
}

/** @deprecated resolveViewportPlatformFromWidth 사용. */
export function resolveEditorPlatformFromWidth(width: number): ViewportPlatform {
  return resolveViewportPlatformFromWidth(width);
}

/** CSS `@media (min-width: …)` 에 넣을 값 (1024px). */
export const VIEWPORT_DESKTOP_MEDIA = `(min-width: ${VIEWPORT_BREAKPOINT_PX}px)`;

/** CSS `@media (max-width: …)` 모바일 구간 (1023px). */
export const VIEWPORT_MOBILE_MEDIA = `(max-width: ${VIEWPORT_BREAKPOINT_PX - 1}px)`;
