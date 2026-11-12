'use client';

import { useCallback, useState } from 'react';
import { registerAccount } from '@/src/shared/auth';
import { useAuth } from '@/src/shared/hooks/useAuth';
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

function usePasswordSignupFields() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<SignupStep>('form');
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

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
    setSubmitting,
    setError,
    setStep,
    setRecoveryCode,
  };
}

async function submitPasswordSignup(
  event: React.FormEvent<HTMLFormElement>,
  fields: ReturnType<typeof usePasswordSignupFields>,
) {
  event.preventDefault();
  if (fields.submitting) return;
  if (fields.password !== fields.passwordConfirm) {
    fields.setError('비밀번호가 일치하지 않습니다.');
    return;
  }
  fields.setSubmitting(true);
  fields.setError(null);
  try {
    const result = await registerAccount({
      username: fields.username.trim(),
      email: fields.email.trim(),
      password: fields.password,
    });
    fields.setRecoveryCode(result.recoveryCode);
    fields.setStep('recovery-code');
  } catch (signupError) {
    fields.setError(signupError instanceof Error
      ? signupError.message
      : mapAuthErrorCode(undefined, '회원가입에 실패했습니다.'));
  } finally {
    fields.setSubmitting(false);
  }
}

export function usePasswordSignupForm(onComplete: () => void): UsePasswordSignupFormResult {
  const { refresh } = useAuth();
  const fields = usePasswordSignupFields();
  const submit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => submitPasswordSignup(event, fields),
    [fields],
  );
  const confirmRecoverySaved = useCallback(async () => {
    await refresh();
    onComplete();
  }, [onComplete, refresh]);
  return { ...fields, submit, confirmRecoverySaved };
}
