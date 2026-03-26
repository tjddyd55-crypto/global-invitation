'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarketingLayout from '@/src/components/MarketingLayout';
import { loginWithPassword, setStoredSession } from '@/src/lib/auth';
import { loginAdmin } from '@/src/lib/adminApi';
import {
  consumeStoredLoginRedirect,
  LOGIN_REDIRECT_STORAGE_KEY,
  resolveLoginRedirectForStorage,
} from '@/src/lib/loginRedirect';
import styles from './login.module.css';

function buildAdminIdCandidates(input: string): string[] {
  const normalized = input.trim();
  if (!normalized) return [];

  const candidates: string[] = [normalized];
  if (normalized.includes('@')) {
    const localPart = normalized.split('@')[0]?.trim();
    if (localPart) {
      candidates.push(localPart);
    }
  } else {
    candidates.push(`${normalized}@naver.com`);
  }

  return Array.from(new Set(candidates));
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = resolveLoginRedirectForStorage(
      searchParams.get('redirect'),
      typeof document !== 'undefined' ? document.referrer : '',
      typeof window !== 'undefined' ? window.location.origin : ''
    );
    sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, redirect);
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await loginWithPassword({
        email: email.trim(),
        password,
      });
      setStoredSession({
        token: result.token,
        user: result.user,
      });

      const redirectTo = consumeStoredLoginRedirect();
      router.replace(redirectTo);
    } catch (loginError) {
      try {
        const adminIdCandidates = buildAdminIdCandidates(email);
        let authenticated = false;
        for (const candidate of adminIdCandidates) {
          try {
            await loginAdmin(candidate, password);
            authenticated = true;
            break;
          } catch {
            // Try next candidate.
          }
        }
        if (!authenticated) {
          throw new Error('관리자 로그인에 실패했습니다.');
        }
        const redirectTo = consumeStoredLoginRedirect();
        router.replace(redirectTo === '/' ? '/admin/templates' : redirectTo);
        return;
      } catch {
        setError(loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingLayout>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>로그인</h1>
          <p className={styles.subtitle}>이메일과 비밀번호로 로그인하세요.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              이메일
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </label>

            <label className={styles.label}>
              비밀번호
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호 입력"
                required
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitButton} type="submit" disabled={submitting}>
              {submitting ? '로그인 처리 중...' : '로그인'}
            </button>
          </form>

          <p className={styles.linkLine}>
            계정이 없나요? <Link href="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <MarketingLayout>
          <div className={styles.page}>
            <div className={styles.card}>
              <p className={styles.subtitle}>로딩 중...</p>
            </div>
          </div>
        </MarketingLayout>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
