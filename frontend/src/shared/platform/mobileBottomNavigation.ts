/**
 * 모바일 SaaS Bottom Navigation 표시 정책 SSOT.
 * 페이지별 중복 조건 금지 — MobileShell 등에서 이 함수만 사용한다.
 *
 * 표시: Main, My Invitations 목록, Dashboard (canonical + /m QA)
 * 숨김: Email OTP, Concept Selection, Editor, Publish flow, Public Invitation
 */
export function shouldShowMobileBottomNavigation(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  if (pathname === '/i' || pathname.startsWith('/i/')) return false;

  // 인증/OTP
  if (pathname.startsWith('/m/email') || pathname.startsWith('/auth/email')) return false;
  if (pathname.startsWith('/m/login') || pathname.startsWith('/m/signup')) return false;
  if (pathname.startsWith('/pc/login') || pathname.startsWith('/pc/signup') || pathname.startsWith('/pc/email')) {
    return false;
  }
  if (pathname.startsWith('/auth/')) return false;
  if (pathname === '/login' || pathname.startsWith('/login/')) return false;
  if (pathname === '/signup' || pathname.startsWith('/signup/')) return false;

  // 컨셉 선택
  if (pathname === '/templates' || pathname.startsWith('/templates/')) return false;
  if (pathname === '/m/templates' || pathname.startsWith('/m/templates/')) return false;
  if (pathname === '/create' || pathname.startsWith('/create/')) return false;
  if (pathname === '/m/create' || pathname.startsWith('/m/create/')) return false;

  // 에디터
  if (pathname.includes('/editor')) return false;

  // Publish / complete flow
  if (/\/my-invitations\/[^/]+\/complete(?:\/|$)/.test(pathname)) return false;

  // 허용: home / my-invitations / dashboard (canonical + /m)
  if (pathname === '/' || pathname === '/m') return true;
  if (pathname === '/my-invitations' || pathname.startsWith('/my-invitations/')) return true;
  if (pathname === '/m/my-invitations' || pathname.startsWith('/m/my-invitations/')) return true;
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true;
  if (pathname === '/m/dashboard' || pathname.startsWith('/m/dashboard/')) return true;
  if (pathname === '/my' || pathname.startsWith('/my/')) return true;
  if (pathname === '/m/my' || pathname.startsWith('/m/my/')) return true;

  return false;
}
