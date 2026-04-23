import { NextRequest, NextResponse } from 'next/server';
import { resolvePlatform, UI_PREF_COOKIE } from '@/src/shared/platform/detect';
import {
  buildPlatformRedirect,
  isAppRoute,
  isForceDesktopRoute,
  isPublicPath,
} from '@/src/shared/platform/routing';

const UI_PREF_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30일

/**
 * 플랫폼 분기 미들웨어.
 *
 * - 공개 URL(/i, /invitation, /message, /preview)과 정적 자산/API 는 통과시킨다.
 * - /admin, /creator 는 공개 URL 이지만 모바일에서 진입 시 "PC 뷰 강제" 쿠키를 세팅한다.
 * - /m, /pc 로 시작하는 요청은 이미 올바른 플랫폼이므로 통과.
 * - 그 외 "앱 라우트"(루트 /, /dashboard, /editor 등)에서만 UA + 쿠키로 리다이렉트한다.
 *
 * 단일 진실 원천: `src/shared/platform/routing.ts`
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isForceDesktopRoute(pathname)) {
    return handleForceDesktop(request);
  }

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
 * `/admin`, `/creator` 등 PC 전용 공개 라우트 처리.
 *
 * - 쿠키가 이미 있으면 사용자 의사를 존중한다 (덮어쓰지 않음).
 * - 쿠키가 없고 UA 가 모바일이면 `ui_pref=desktop` 을 자동 세팅하여
 *   이후 다른 앱 라우트 이동 시에도 PC 뷰로 일관되게 분기되도록 한다.
 */
function handleForceDesktop(request: NextRequest): NextResponse {
  const existing = request.cookies.get(UI_PREF_COOKIE)?.value;
  if (existing) {
    return NextResponse.next();
  }

  const platform = resolvePlatform({
    userAgent: request.headers.get('user-agent'),
    uiPrefCookie: null,
  });

  if (platform !== 'mobile') {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(UI_PREF_COOKIE, 'desktop', {
    path: '/',
    maxAge: UI_PREF_MAX_AGE_SECONDS,
    sameSite: 'lax',
  });
  return response;
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
