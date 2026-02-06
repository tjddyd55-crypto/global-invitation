'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setStoredSession, verifyMagicLink } from '@/src/lib/auth';

export default function MagicLinkVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const draft = searchParams.get('draft');
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    if (!token) {
      setMessage('유효하지 않은 링크입니다.');
      return;
    }

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
