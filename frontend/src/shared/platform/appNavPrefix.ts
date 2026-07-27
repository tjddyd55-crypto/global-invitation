/**
 * 현재 pathname 기준 앱 내비 prefix.
 * - /m/* → '/m' (QA)
 * - /pc/* → '/pc' (QA)
 * - 그 외 canonical → '' (공식 URL)
 */
export type AppNavPrefix = '' | '/m' | '/pc';

export function resolveAppNavPrefix(pathname: string | null | undefined): AppNavPrefix {
  if (!pathname) return '';
  if (pathname === '/m' || pathname.startsWith('/m/')) return '/m';
  if (pathname === '/pc' || pathname.startsWith('/pc/')) return '/pc';
  return '';
}

export function appPath(prefix: AppNavPrefix, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!prefix) {
    return normalized === '/' ? '/' : normalized;
  }
  if (normalized === '/') return prefix;
  return `${prefix}${normalized}`;
}
