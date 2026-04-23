'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithPassword, setStoredSession } from '@/src/lib/auth';
import {
  consumeStoredLoginRedirect,
  LOGIN_REDIRECT_STORAGE_KEY,
  resolveLoginRedirectForStorage,
} from '@/src/lib/loginRedirect';
import { tryAdminLoginFallback } from './adminFallback';

export interface UseLoginFormResult {
  email: string;
  password: string;
  submitting: boolean;
  error: string | null;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  submit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * 로그인 폼의 상태/제출을 관리하는 훅.
 * - PC 와 모바일 UI 가 동일한 로직을 공유한다.
 * - 관리자 fallback 은 adminFallback 모듈이 담당한다 (이 훅은 관리자/일반 여부를 몰라도 됨).
 */
export function useLoginForm(opts?: { adminRedirectPath?: string }): UseLoginFormResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirect = resolveLoginRedirectForStorage(searchParams.get('redirect'), referrer, origin);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, redirect);
    }
  }, [searchParams]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      setSubmitting(true);
      setError(null);
      try {
        const result = await loginWithPassword({ email: email.trim(), password });
        setStoredSession({ token: result.token, user: result.user });
        router.replace(consumeStoredLoginRedirect());
      } catch (loginError) {
        const adminSucceeded = await tryAdminLoginFallback(email, password);
        if (adminSucceeded) {
          const redirectTo = consumeStoredLoginRedirect();
          const fallback = opts?.adminRedirectPath ?? '/admin/templates';
          router.replace(redirectTo === '/' ? fallback : redirectTo);
          return;
        }
        setError(loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.');
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, submitting, router, opts?.adminRedirectPath],
  );

  return { email, password, submitting, error, setEmail, setPassword, submit };
}
