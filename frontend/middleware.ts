import { NextRequest, NextResponse } from 'next/server';
import { resolvePlatform, UI_PREF_COOKIE } from '@/src/shared/platform/detect';
import { isForceDesktopRoute } from '@/src/shared/platform/routing';

const UI_PREF_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30일

/**
 * 플랫폼 미들웨어.
 *
 * - 공식 URL(/, /templates, /editor, …)은 유지한다.
 *   Mobile/Desktop presentation 은 클라이언트 viewport(1024) 로만 전환한다.
 * - /m, /pc 는 QA·직접 테스트용으로 통과만 시킨다 (UA 강제 리다이렉트 없음).
 * - /admin, /creator 는 모바일 UA 진입 시 PC 뷰 쿠키를 세팅한다.
 *
 * Viewport SSOT: `src/shared/platform/viewportBreakpoint.ts` (1024px)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isForceDesktopRoute(pathname)) {
    return handleForceDesktop(request);
  }

  return NextResponse.next();
}

/**
 * `/admin`, `/creator` 등 PC 전용 공개 라우트 처리.
 *
 * - 쿠키가 이미 있으면 사용자 의사를 존중한다 (덮어쓰지 않음).
 * - 쿠키가 없고 UA 가 모바일이면 `ui_pref=desktop` 을 자동 세팅한다.
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

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|icons|images|favicon|manifest.webmanifest|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
