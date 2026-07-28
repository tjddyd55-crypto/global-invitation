'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requestEmailVerificationCode, setStoredSession, verifyEmailVerificationCode } from '@/src/shared/auth';
import { useAuth } from '@/src/shared/hooks';
import { resolveAuthNextPath } from './authNextPath';
import { clearAuthEmail, readAuthEmail, saveAuthEmail } from './authEmailStorage';
import {
  clearDevOtpPreviewCode,
  consumeDevOtpPreviewCode,
  saveDevOtpPreviewCode,
} from './devOtpPreviewStore';

export const OTP_CODE_LENGTH = 6;
const CODE_EXPIRY_SECONDS = 10 * 60;

export interface UseEmailVerifyFormResult {
  email: string | null;
  code: string;
  submitting: boolean;
  error: string | null;
  previewCode: string | null;
  remainingSeconds: number;
  isCodeComplete: boolean;
  setCode: (value: string) => void;
  verify: () => Promise<void>;
  resend: () => Promise<void>;
  editEmailHref: string;
}

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Figma Make Email Verify 전용 모델 (OTP 입력).
 */
export function useEmailVerifyForm(): UseEmailVerifyFormResult {
  const router = useRouter();
  const { refresh } = useAuth();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => resolveAuthNextPath(searchParams.get('next')), [searchParams]);
  const queryEmail = searchParams.get('email');

  const [email, setEmailState] = useState<string | null>(() => readAuthEmail() ?? queryEmail);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(() => consumeDevOtpPreviewCode());
  const [remainingSeconds, setRemainingSeconds] = useState(CODE_EXPIRY_SECONDS);

  useEffect(() => {
    if (email || !queryEmail) return;
    setEmailState(queryEmail);
    saveAuthEmail(queryEmail);
  }, [email, queryEmail]);

  useEffect(() => {
    if (!email) {
      router.replace(`/auth/email?next=${encodeURIComponent(nextPath)}`);
    }
  }, [email, nextPath, router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isCodeComplete = code.length === OTP_CODE_LENGTH;

  const verify = useCallback(async () => {
    if (submitting || !isCodeComplete || !email) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyEmailVerificationCode({ email, code });
      setStoredSession({ token: result.token, user: result.user });
      clearAuthEmail();
      clearDevOtpPreviewCode();
      await refresh();
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 확인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [code, email, isCodeComplete, nextPath, refresh, router, submitting]);

  const resend = useCallback(async () => {
    if (submitting || !email) return;
    setSubmitting(true);
    setError(null);
    setCode('');
    try {
      const result = await requestEmailVerificationCode(email);
      const nextPreview = result.previewCode?.trim() || null;
      saveDevOtpPreviewCode(nextPreview);
      setPreviewCode(nextPreview);
      setRemainingSeconds(CODE_EXPIRY_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 재발송에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting]);

  const editEmailHref = `/auth/email?next=${encodeURIComponent(nextPath)}`;

  return {
    email,
    code,
    submitting,
    error,
    previewCode,
    remainingSeconds,
    isCodeComplete,
    setCode,
    verify,
    resend,
    editEmailHref,
  };
}

export { formatRemaining };
