/**
 * /m · /pc 플랫폼 앱 셸 경로 판정 SSOT.
 * ClientLayout / GlobalHeader 등에서 SaaS chrome을 끌 때 사용한다.
 */
export function isPlatformAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === '/m' ||
    pathname.startsWith('/m/') ||
    pathname === '/pc' ||
    pathname.startsWith('/pc/')
  );
}
