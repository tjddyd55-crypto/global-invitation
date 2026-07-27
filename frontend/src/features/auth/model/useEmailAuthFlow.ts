'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  requestEmailVerificationCode,
  setStoredSession,
  verifyEmailVerificationCode,
} from '@/src/shared/auth';
import { resolveAuthNextPath } from './authNextPath';

export type EmailAuthStep = 'email' | 'code';

export interface UseEmailAuthFlowResult {
  step: EmailAuthStep;
  email: string;
  code: string;
  submitting: boolean;
  error: string | null;
  previewCode: string | null;
  setEmail: (value: string) => void;
  setCode: (value: string) => void;
  requestCode: () => Promise<void>;
  verifyCode: () => Promise<void>;
  resendCode: () => Promise<void>;
  editEmail: () => void;
}

/**
 * 이메일 OTP 인증 플로우 (레거시 단일 화면 `EmailAuthForm` 용).
 * - 비밀번호 없이 로그인/자동가입을 하나로 처리한다.
 * - 성공 시 세션 저장 후 next 경로(기본 /create/concept)로 이동한다.
 *
 * 참고: canonical `/auth/email`, `/auth/verify` 는 이 훅 대신
 * `useEmailStartForm` / `useEmailVerifyForm` 로 화면이 분리되어 있다.
 * 두 훅 모두 `@/src/shared/auth` 의 동일한 API 함수를 호출한다.
 */
export function useEmailAuthFlow(): UseEmailAuthFlowResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => resolveAuthNextPath(searchParams.get('next')), [searchParams]);

  const [step, setStep] = useState<EmailAuthStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const requestCode = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setPreviewCode(null);
    try {
      const result = await requestEmailVerificationCode(email);
      if (result.previewCode) {
        setPreviewCode(result.previewCode);
      }
      setStep('code');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting]);

  const verifyCode = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyEmailVerificationCode({ email, code });
      setStoredSession({
        token: result.token,
        user: result.user,
      });
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 확인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [code, email, nextPath, router, submitting]);

  const resendCode = useCallback(async () => {
    await requestCode();
  }, [requestCode]);

  const editEmail = useCallback(() => {
    setStep('email');
    setCode('');
    setError(null);
    setPreviewCode(null);
  }, []);

  return {
    step,
    email,
    code,
    submitting,
    error,
    previewCode,
    setEmail,
    setCode,
    requestCode,
    verifyCode,
    resendCode,
    editEmail,
  };
}
