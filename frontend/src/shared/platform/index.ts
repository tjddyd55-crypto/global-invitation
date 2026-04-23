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
