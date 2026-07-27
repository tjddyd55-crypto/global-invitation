'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requestEmailVerificationCode } from '@/src/shared/auth';
import { resolveAuthNextPath } from './authNextPath';
import { saveAuthEmail } from './authEmailStorage';

export interface UseEmailStartFormResult {
  email: string;
  submitting: boolean;
  error: string | null;
  isValidEmail: boolean;
  setEmail: (value: string) => void;
  submit: () => Promise<void>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Figma Make `EmailStartScreen` / `DesktopEmailStartScreen` 전용 모델.
 * 인증번호 발송에 성공하면 이메일을 세션에 저장하고 `/auth/verify` 로 이동한다.
 */
export function useEmailStartForm(): UseEmailStartFormResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => resolveAuthNextPath(searchParams.get('next')), [searchParams]);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = EMAIL_PATTERN.test(email.trim());

  const submit = useCallback(async () => {
    if (submitting || !isValidEmail) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestEmailVerificationCode(email.trim());
      saveAuthEmail(email.trim());
      router.push(`/auth/verify?next=${encodeURIComponent(nextPath)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [email, isValidEmail, nextPath, router, submitting]);

  return { email, submitting, error, isValidEmail, setEmail, submit };
}
