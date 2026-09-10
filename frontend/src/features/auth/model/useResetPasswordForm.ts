'use client';

import { useCallback, useState } from 'react';
import { resetPasswordWithAdminLink, validateAdminResetToken } from '@/src/lib/auth';
import { mapAuthErrorCode } from '@/src/shared/auth/authErrorMessages';

export type AdminResetStep = 'form' | 'new-recovery-code';

export function useResetPasswordForm(token: string, onComplete: () => void) {
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<AdminResetStep>('form');
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);

  const validate = useCallback(async () => {
    if (!token) {
      setTokenValid(false);
      setValidating(false);
      setError('유효하지 않은 링크입니다.');
      return;
    }
    setValidating(true);
    try {
      await validateAdminResetToken(token);
      setTokenValid(true);
      setError(null);
    } catch {
      setTokenValid(false);
      setError(mapAuthErrorCode('INVALID_OR_EXPIRED_TOKEN', '링크가 유효하지 않습니다.'));
    } finally {
      setValidating(false);
    }
  }, [token]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting || !token) return;

      if (newPassword !== newPasswordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const result = await resetPasswordWithAdminLink({ token, newPassword });
        setNewRecoveryCode(result.newRecoveryCode);
        setStep('new-recovery-code');
      } catch (resetError) {
        setError(
          resetError instanceof Error
            ? resetError.message
            : mapAuthErrorCode(undefined, '비밀번호 변경에 실패했습니다.')
        );
      } finally {
        setSubmitting(false);
      }
    },
    [newPassword, newPasswordConfirm, submitting, token]
  );

  const finish = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return {
    newPassword,
    newPasswordConfirm,
    submitting,
    validating,
    tokenValid,
    error,
    step,
    newRecoveryCode,
    setNewPassword,
    setNewPasswordConfirm,
    validate,
    submit,
    finish,
  };
}
