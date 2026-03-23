'use client';

import { usePathname } from 'next/navigation';
import AdminShell from '@/src/components/admin/AdminShell';

/**
 * `/admin/templates/[id]/preview` 는 iframe/탭에서 "순수 템플릿만" 보여야 하므로 AdminShell 을 적용하지 않는다.
 * (preview 세그먼트 전용 layout 만으로는 상위 admin layout 이 합성되므로 여기서 분기한다.)
 */
function isBareTemplatePreviewPath(pathname: string): boolean {
  return /^\/admin\/templates\/[^/]+\/preview\/?$/.test(pathname);
}

export default function AdminLayoutBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  if (isBareTemplatePreviewPath(pathname)) {
    return <>{children}</>;
  }
  return <AdminShell>{children}</AdminShell>;
}
