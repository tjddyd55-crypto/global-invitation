/**
 * 에디터 플랫폼 분기용 viewport breakpoint (CSS와 동일 SSOT).
 * - 이하: mobile editor (/m/editor)
 * - 초과: desktop editor (/pc/editor)
 */
export const EDITOR_VIEWPORT_BREAKPOINT_PX = 768;

export function resolveEditorPlatformFromWidth(width: number): 'mobile' | 'desktop' {
  return width <= EDITOR_VIEWPORT_BREAKPOINT_PX ? 'mobile' : 'desktop';
}
