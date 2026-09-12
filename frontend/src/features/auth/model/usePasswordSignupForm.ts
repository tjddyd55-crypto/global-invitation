'use client';

import { useCallback, useState } from 'react';
import { registerAccount } from '@/src/lib/auth';
import { mapAuthErrorCode } from '@/src/shared/auth/authErrorMessages';

export type SignupStep = 'form' | 'recovery-code';

export interface UsePasswordSignupFormResult {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  submitting: boolean;
  error: string | null;
  step: SignupStep;
  recoveryCode: string | null;
  setUsername: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setPasswordConfirm: (value: string) => void;
  submit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  confirmRecoverySaved: () => void;
}

export function usePasswordSignupForm(onComplete: () => void): UsePasswordSignupFormResult {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<SignupStep>('form');
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      if (password !== passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const result = await registerAccount({
          username: username.trim(),
          email: email.trim(),
          password,
        });
        setRecoveryCode(result.recoveryCode);
        setStep('recovery-code');
      } catch (signupError) {
        setError(
          signupError instanceof Error
            ? signupError.message
            : mapAuthErrorCode(undefined, '회원가입에 실패했습니다.')
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, passwordConfirm, submitting, username]
  );

  const confirmRecoverySaved = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return {
    username,
    email,
    password,
    passwordConfirm,
    submitting,
    error,
    step,
    recoveryCode,
    setUsername,
    setEmail,
    setPassword,
    setPasswordConfirm,
    submit,
    confirmRecoverySaved,
  };
}
