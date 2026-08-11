/**
 * 플랫폼 라우팅 규칙.
 *
 * - 공식 URL은 canonical 경로를 유지하고, Mobile/Desktop 은 viewport(1024) shell 로 전환한다.
 * - /m · /pc 는 QA·직접 테스트용. middleware 는 UA로 /m|/pc 강제 리다이렉트하지 않는다.
 * - buildPlatformRedirect 는 레거시/테스트 헬퍼로만 유지한다.
 * - 공개 URL / API / 정적 파일은 PUBLIC_PREFIXES.
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
  // `/editor` 는 canonical + viewport shell. /m/editor · /pc/editor 는 QA용.
  '/editor',
  '/create',
  '/templates',
  '/settings',
  '/message/editor',
  '/invitations',
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

/**
 * 모바일 UA 로 진입했어도 PC 뷰로 강제해야 하는 라우트.
 *
 * 대상:
 * - `/admin/*` : 관리자 페이지 (PC 전용 정책, `AGENTS.md` 참고).
 * - `/creator/*` : 중단된 기능이지만 PC 로만 구현되어 있음.
 *
 * 동작: middleware 가 모바일 UA + `ui_pref` 쿠키 없음을 감지하면
 * `ui_pref=desktop` 을 자동 세팅한다. 이후 이동하는 모든 앱 라우트도 PC 뷰로 분기된다.
 * 사용자가 이미 쿠키를 `mobile` 로 고정한 경우엔 그 의사를 덮어쓰지 않는다.
 */
export const FORCE_DESKTOP_PREFIXES: readonly string[] = [
  '/admin',
  '/creator',
];

export function isForceDesktopRoute(pathname: string): boolean {
  return FORCE_DESKTOP_PREFIXES.some((prefix) => pathSegmentMatches(pathname, prefix));
}
