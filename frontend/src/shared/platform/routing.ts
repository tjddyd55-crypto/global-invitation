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
 * (배열 순서가 매치 우선순위에 영향을 주지 않도록 각 항목은 서로 접두사가 겹치지 않게 유지)
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
 * - 공개 초대장/메시지 URL (SEO·공유링크)
 * - API / Next 내부 / 정적 자산
 * - 이미 /m, /pc 로 시작하는 경로 (무한 리다이렉트 방지)
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
  '/i/',
  '/invitation/',
  '/message/',
  '/preview/',
  '/admin',
  '/m',
  '/pc',
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix));
}

export function isAppRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

export function buildPlatformRedirect(pathname: string, platform: Platform): string {
  const prefix = PLATFORM_PATH_PREFIX[platform];
  if (pathname === '/') return prefix;
  return `${prefix}${pathname}`;
}
