'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithPassword, setStoredSession } from '@/src/shared/auth';
import { useAuth } from '@/src/shared/hooks/useAuth';
import {
  consumeStoredLoginRedirect,
  LOGIN_REDIRECT_STORAGE_KEY,
  resolveLoginRedirectForStorage,
  getAuthReturnParam,
} from '@/src/lib/loginRedirect';
import { mapAuthErrorCode } from '@/src/shared/auth/authErrorMessages';

export interface UseLoginFormResult {
  username: string;
  password: string;
  submitting: boolean;
  error: string | null;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  submit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * 로그인 폼의 상태/제출을 관리하는 훅.
 * - PC 와 모바일 UI 가 동일한 로직을 공유한다.
 * - 관리자 fallback 은 adminFallback 모듈이 담당한다 (이 훅은 관리자/일반 여부를 몰라도 됨).
 */
function useLoginRedirect() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirect = resolveLoginRedirectForStorage(getAuthReturnParam(searchParams), referrer, origin);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, redirect);
    }
  }, [searchParams]);
}

export function useLoginForm(): UseLoginFormResult {
  const router = useRouter();
  const { refresh } = useAuth();
  useLoginRedirect();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await loginWithPassword({ username: username.trim(), password });
      setStoredSession({ token: result.token, user: result.user });
      await refresh();
      router.replace(consumeStoredLoginRedirect());
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : mapAuthErrorCode(undefined, '로그인에 실패했습니다.')
      );
    } finally {
      setSubmitting(false);
    }
  }, [username, password, submitting, router, refresh]);

  return { username, password, submitting, error, setUsername, setPassword, submit };
}
