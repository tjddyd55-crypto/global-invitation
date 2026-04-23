/**
 * 플랫폼 라우팅 규칙.
 *
 * - "앱 라우트"(APP_PREFIXES) 는 middleware 에서 /m 또는 /pc 로 리다이렉트한다.
 * - 공개 URL / API / 정적 파일은 절대 건드리지 않는다 (PUBLIC_PREFIXES).
 *
 * 이 목록이 단일 진실 원천이다. 새 앱 라우트가 추가되면 반드시 여기에도 등록한다.
 */

import type { Platform } from './detect';

export const PLATFORM_PATH_PREFIX: Record<Platform, '/m' | '/pc'> = {
  mobile: '/m',
  desktop: '/pc',
};

/**
 * 플랫폼별로 반드시 쪼개야 하는 루트 레벨 경로.
 * - 배열 순서는 매칭 결과에 영향을 주지 않는다 (isAppRoute 는 "세그먼트 매칭" 만 한다).
 * - /message/editor 처럼 더 깊은 경로는 반드시 얕은 공개 경로(/message) 보다 APP_ROUTE 에 등록되어야 한다.
 */
export const APP_ROUTE_PREFIXES: readonly string[] = [
  '/login',
  '/signup',
  '/dashboard',
  '/my',
  '/my-invitations',
  '/editor',
  '/create',
  '/templates',
  '/settings',
  '/message/editor',
];

/**
 * 절대 리다이렉트하지 않는 경로.
 * 여기에 해당하면 middleware 는 즉시 통과시킨다.
 *
 * 주의: 단순 `pathname.startsWith('/m')` 매칭은 `/my`, `/message` 까지 잡아버리므로,
 * "세그먼트 경계(/, = 또는 끝)"까지 확인해야 한다 → pathSegmentMatches 로 판정.
 */
export const PUBLIC_PATH_PREFIXES: readonly string[] = [
  '/api',
  '/_next',
  '/assets',
  '/icons',
  '/images',
  '/favicon',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/i',
  '/invitation',
  '/preview',
  '/admin',
  // '/creator': 중단된 기능 (템플릿 제작·공유). 분기하지 않고 통과만 시킨다. AGENTS.md 참고.
  '/creator',
  '/pricing',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/payment-info',
  '/pwa-settings',
  '/auth',
  '/m',
  '/pc',
];

/**
 * "세그먼트 경계"까지 고려한 prefix 매칭.
 * - `/m` 은 `/m`, `/m/xxx` 에만 매치되고 `/my`, `/my-invitations` 에는 매치되지 않는다.
 */
function pathSegmentMatches(pathname: string, prefix: string): boolean {
  if (pathname === prefix) return true;
  return pathname.startsWith(prefix + '/');
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathSegmentMatches(pathname, prefix));
}

export function isAppRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return APP_ROUTE_PREFIXES.some((prefix) => pathSegmentMatches(pathname, prefix));
}

export function buildPlatformRedirect(pathname: string, platform: Platform): string {
  const prefix = PLATFORM_PATH_PREFIX[platform];
  if (pathname === '/') return prefix;
  return `${prefix}${pathname}`;
}
