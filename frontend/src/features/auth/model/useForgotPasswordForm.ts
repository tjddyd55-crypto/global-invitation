'use client';

import { useCallback, useState } from 'react';
import { resetPasswordWithRecovery, verifyRecoveryCredentials } from '@/src/lib/auth';
import { mapAuthErrorCode } from '@/src/shared/auth/authErrorMessages';

export type ForgotPasswordStep = 'verify' | 'reset' | 'new-recovery-code';

export interface UseForgotPasswordFormResult {
  username: string;
  email: string;
  recoveryCode: string;
  newPassword: string;
  newPasswordConfirm: string;
  recoveryToken: string | null;
  newRecoveryCode: string | null;
  step: ForgotPasswordStep;
  submitting: boolean;
  error: string | null;
  setUsername: (value: string) => void;
  setEmail: (value: string) => void;
  setRecoveryCode: (value: string) => void;
  setNewPassword: (value: string) => void;
  setNewPasswordConfirm: (value: string) => void;
  verify: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  reset: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  finish: () => void;
}

export function useForgotPasswordForm(onComplete: () => void): UseForgotPasswordFormResult {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [step, setStep] = useState<ForgotPasswordStep>('verify');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      setSubmitting(true);
      setError(null);
      try {
        const result = await verifyRecoveryCredentials({
          username: username.trim(),
          email: email.trim(),
          recoveryCode: recoveryCode.trim(),
        });
        setRecoveryToken(result.recoveryToken);
        setStep('reset');
      } catch (verifyError) {
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : mapAuthErrorCode(undefined, '복구코드 확인에 실패했습니다.')
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, recoveryCode, submitting, username]
  );

  const reset = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting || !recoveryToken) return;

      if (newPassword !== newPasswordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const result = await resetPasswordWithRecovery({
          recoveryToken,
          newPassword,
        });
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
    [newPassword, newPasswordConfirm, recoveryToken, submitting]
  );

  const finish = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return {
    username,
    email,
    recoveryCode,
    newPassword,
    newPasswordConfirm,
    recoveryToken,
    newRecoveryCode,
    step,
    submitting,
    error,
    setUsername,
    setEmail,
    setRecoveryCode,
    setNewPassword,
    setNewPasswordConfirm,
    verify,
    reset,
    finish,
  };
}
