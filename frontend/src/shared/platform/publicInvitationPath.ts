/**
 * 공개 초대장(/i/{shareSlug}) 경로 판정 — ClientLayout / GlobalHeader 공통 SSOT.
 */
export function isPublicInvitationPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === '/i' || pathname.startsWith('/i/');
}
