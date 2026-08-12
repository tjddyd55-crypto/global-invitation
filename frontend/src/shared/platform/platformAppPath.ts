/**
 * SaaS GlobalHeader / LanguageModal 을 숨기는 presentation 경로 SSOT.
 * /m · /pc(QA), canonical viewport 앱 화면, 그리고 자체 MarketingSiteHeader 를
 * 그리는 public marketing 페이지(/ , /pricing, /contact)를 포함한다.
 */
export function isPlatformAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  if (
    pathname === '/m' ||
    pathname.startsWith('/m/') ||
    pathname === '/pc' ||
    pathname.startsWith('/pc/')
  ) {
    return true;
  }

  // Canonical app surfaces (공식 URL — viewport shell)
  if (pathname === '/') return true;
  // Marketing pages own MarketingSiteHeader — do not also mount SaaS GlobalHeader.
  if (pathname === '/pricing' || pathname.startsWith('/pricing/')) return true;
  if (pathname === '/contact' || pathname.startsWith('/contact/')) return true;
  if (pathname === '/editor' || pathname.startsWith('/editor/')) return true;
  if (pathname === '/templates' || pathname.startsWith('/templates/')) return true;
  if (pathname === '/my-invitations' || pathname.startsWith('/my-invitations/')) return true;
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true;
  if (pathname === '/create' || pathname.startsWith('/create/')) return true;
  if (pathname === '/publish' || pathname.startsWith('/publish')) return true;
  if (pathname === '/auth/email' || pathname.startsWith('/auth/email')) return true;
  if (pathname === '/auth/verify' || pathname.startsWith('/auth/verify')) return true;
  if (pathname === '/login' || pathname.startsWith('/login')) return true;
  if (pathname === '/signup' || pathname.startsWith('/signup')) return true;
  if (pathname === '/my' || pathname.startsWith('/my/')) return true;
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return true;
  // Admin portal — no SaaS marketing header / auth chrome
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;

  return false;
}
