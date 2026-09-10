'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LegacyAuthEmailRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get('next');
    const target = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
    router.replace(target);
  }, [router, searchParams]);

  return null;
}

/** @deprecated 이메일 OTP 제거 — /login 으로 리다이렉트 */
export default function LegacyAuthEmailRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LegacyAuthEmailRedirectContent />
    </Suspense>
  );
}
