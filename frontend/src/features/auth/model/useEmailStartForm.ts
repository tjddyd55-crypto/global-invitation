'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requestEmailVerificationCode } from '@/src/shared/auth';
import { resolveAuthNextPath } from './authNextPath';
import { saveAuthEmail } from './authEmailStorage';
import { saveDevOtpPreviewCode } from './devOtpPreviewStore';

export interface UseEmailStartFormResult {
  email: string;
  submitting: boolean;
  error: string | null;
  isValidEmail: boolean;
  previewCode: string | null;
  codeSent: boolean;
  setEmail: (value: string) => void;
  submit: () => Promise<void>;
  continueToVerify: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Figma Make Email Start 전용 모델.
 * 발송 성공 시 development previewCode 가 있으면 화면에 표시한 뒤 Verify 로 이동한다.
 */
export function useEmailStartForm(): UseEmailStartFormResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => resolveAuthNextPath(searchParams.get('next')), [searchParams]);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  const isValidEmail = EMAIL_PATTERN.test(email.trim());

  const continueToVerify = useCallback(() => {
    router.push(`/auth/verify?next=${encodeURIComponent(nextPath)}`);
  }, [nextPath, router]);

  const submit = useCallback(async () => {
    if (submitting || !isValidEmail) return;
    if (codeSent) {
      continueToVerify();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestEmailVerificationCode(email.trim());
      saveAuthEmail(email.trim());
      const nextPreview = result.previewCode?.trim() || null;
      saveDevOtpPreviewCode(nextPreview);
      setPreviewCode(nextPreview);
      setCodeSent(true);
      if (!nextPreview) {
        continueToVerify();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [codeSent, continueToVerify, email, isValidEmail, submitting]);

  return {
    email,
    submitting,
    error,
    isValidEmail,
    previewCode,
    codeSent,
    setEmail,
    submit,
    continueToVerify,
  };
}
