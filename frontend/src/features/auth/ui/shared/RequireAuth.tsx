'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/shared/hooks/useAuth';
import { requireAuthenticatedNextPath } from '@/src/shared/auth/authEntryPaths';

type RequireAuthProps = {
  children: React.ReactNode;
  /** 미인증 시 이동할 next 경로. 기본은 현재 pathname. */
  nextPath?: string;
};

/**
 * 작성자 전용 화면 가드.
 * loading 중에는 redirect/children 렌더하지 않는다.
 * 참석자 공개 링크(/i)에는 사용하지 않는다.
 */
export default function RequireAuth({ children, nextPath }: RequireAuthProps) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    const target = nextPath || pathname || '/create/concept';
    router.replace(requireAuthenticatedNextPath(target));
  }, [nextPath, pathname, router, status]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
