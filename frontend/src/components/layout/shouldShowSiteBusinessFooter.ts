/**
 * 일반 서비스 화면에 사업자 정보를 노출할지 판정.
 * 공개 초대장·에디터·초대장 본문/프리뷰에서는 숨긴다.
 */
export function shouldShowSiteBusinessFooter(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  if (pathname === '/i' || pathname.startsWith('/i/')) return false;
  if (pathname === '/invitation' || pathname.startsWith('/invitation/')) return false;
  if (pathname.includes('/editor')) return false;
  if (pathname === '/preview' || pathname.startsWith('/preview/')) return false;
  if (pathname.startsWith('/message/') && !pathname.includes('/editor')) return false;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return false;
  if (pathname === '/dev' || pathname.startsWith('/dev/')) return false;

  return true;
}
