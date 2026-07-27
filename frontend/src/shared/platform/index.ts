export {
  detectPlatformFromUA,
  normalizePlatformPref,
  resolvePlatform,
  UI_PREF_COOKIE,
} from './detect';
export type { Platform } from './detect';

export {
  APP_ROUTE_PREFIXES,
  PUBLIC_PATH_PREFIXES,
  PLATFORM_PATH_PREFIX,
  isAppRoute,
  isPublicPath,
  buildPlatformRedirect,
} from './routing';

export { usePlatform } from './usePlatform';

export {
  VIEWPORT_BREAKPOINT_PX,
  EDITOR_VIEWPORT_BREAKPOINT_PX,
  resolveViewportPlatformFromWidth,
  resolveEditorPlatformFromWidth,
  VIEWPORT_DESKTOP_MEDIA,
  VIEWPORT_MOBILE_MEDIA,
} from './viewportBreakpoint';
export type { ViewportPlatform } from './viewportBreakpoint';
export { useViewportPlatform } from './useViewportPlatform';
export { default as ResponsivePlatformBoundary } from './ResponsivePlatformBoundary';
export { resolveAppNavPrefix, appPath } from './appNavPrefix';
export type { AppNavPrefix } from './appNavPrefix';
