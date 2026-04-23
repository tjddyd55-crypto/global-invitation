import { NextRequest, NextResponse } from 'next/server';
import { resolvePlatform, UI_PREF_COOKIE } from '@/src/shared/platform/detect';
import { buildPlatformRedirect, isAppRoute, isPublicPath } from '@/src/shared/platform/routing';

/**
 * 플랫폼 분기 미들웨어.
 *
 * - 공개 URL(/i, /invitation, /message, /preview)과 정적 자산/API 는 통과시킨다.
 * - /m, /pc 로 시작하는 요청은 이미 올바른 플랫폼이므로 통과.
 * - 그 외 "앱 라우트"(루트 /, /dashboard, /editor 등)에서만 UA + 쿠키로 리다이렉트한다.
 *
 * 단일 진실 원천: `src/shared/platform/routing.ts` 의 APP_ROUTE_PREFIXES / PUBLIC_PATH_PREFIXES.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAppRoute(pathname)) {
    return NextResponse.next();
  }

  const platform = resolvePlatform({
    userAgent: request.headers.get('user-agent'),
    uiPrefCookie: request.cookies.get(UI_PREF_COOKIE)?.value ?? null,
  });

  const targetPath = buildPlatformRedirect(pathname, platform);
  if (targetPath === pathname) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = targetPath;
  return NextResponse.redirect(url, { status: 307 });
}

/**
 * 미들웨어가 돌 경로를 매처로 제한한다.
 * - _next, 정적 자산, API, 이미지 등은 애초에 매칭되지 않게 한다 (성능).
 * - 실제 판정 로직은 routing.ts 의 isAppRoute / isPublicPath 가 담당한다.
 */
export const config = {
  matcher: [
    // 정적 자산/이미지/파일명(확장자) 제외, api / _next 제외
    '/((?!api|_next/static|_next/image|assets|icons|images|favicon|manifest.webmanifest|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
