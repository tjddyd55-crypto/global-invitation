'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/shared/hooks';
import { resolveAuthNextPath } from '@/src/features/auth/model/authNextPath';

/**
 * 이미 인증된 사용자가 /auth/email · /auth/verify 에 들어오면 next 로 보낸다.
 * loading 중에는 redirect 하지 않는다.
 */
export default function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveAuthNextPath(searchParams.get('next'));

  useEffect(() => {
    if (status !== 'authenticated') return;
    router.replace(nextPath);
  }, [nextPath, router, status]);

  if (status === 'loading' || status === 'authenticated') {
    return null;
  }

  return <>{children}</>;
}
