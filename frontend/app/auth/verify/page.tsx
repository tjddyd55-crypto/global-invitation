'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setStoredSession, verifyMagicLink } from '@/src/lib/auth';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import EmailVerifyScreen from '@/src/features/auth/ui/mobile/EmailVerifyScreen';
import DesktopEmailVerifyScreen from '@/src/features/auth/ui/pc/DesktopEmailVerifyScreen';
import RedirectIfAuthenticated from '@/src/features/auth/ui/shared/RedirectIfAuthenticated';

/** 기존 매직링크(`?token=`) 인증 — Figma 이전부터 쓰던 경로, 그대로 유지한다. */
function MagicLinkVerifyContent({ token, draft }: { token: string; draft: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    verifyMagicLink(token)
      .then((result) => {
        setStoredSession({ token: result.token, user: result.user });
        const redirectSlug = result.redirectSlug || draft;
        if (redirectSlug) {
          router.replace(`/editor/${redirectSlug}`);
          return;
        }
        router.replace('/dashboard');
      })
      .catch(() => {
        setMessage('로그인 처리에 실패했습니다. 다시 시도해 주세요.');
      });
  }, [token, draft, router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>{message}</p>
    </div>
  );
}

/**
 * `?token=` 이 있으면 매직링크, 없으면 Figma Make OTP Email Verify 화면으로 분기한다.
 */
function VerifyRouter() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const draft = searchParams.get('draft');

  if (token) {
    return <MagicLinkVerifyContent token={token} draft={draft} />;
  }

  return (
    <RedirectIfAuthenticated>
      <ResponsivePlatformBoundary mobile={<EmailVerifyScreen />} desktop={<DesktopEmailVerifyScreen />} />
    </RedirectIfAuthenticated>
  );
}

export default function AuthVerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}><p>로그인 처리 중...</p></div>}>
      <VerifyRouter />
    </Suspense>
  );
}
