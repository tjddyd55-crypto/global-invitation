'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLoginError } from '@/src/features/admin/adminLoginMessages';
import { getAdminSession, loginAdmin } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

function resolveSafeAdminNext(raw: string | null): string {
  if (!raw) return '/admin';
  const value = raw.trim();
  if (!value.startsWith('/admin')) return '/admin';
  if (value.startsWith('//')) return '/admin';
  if (value.includes('://')) return '/admin';
  return value;
}

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryUntilMs, setRetryUntilMs] = useState<number | null>(null);

  useEffect(() => {
    if (!retryUntilMs) return undefined;
    const remainingMs = retryUntilMs - Date.now();
    if (remainingMs <= 0) {
      setRetryUntilMs(null);
      return undefined;
    }
    const timer = window.setTimeout(() => setRetryUntilMs(null), remainingMs);
    return () => window.clearTimeout(timer);
  }, [retryUntilMs]);

  const rateLimited = retryUntilMs != null && retryUntilMs > Date.now();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rateLimited) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await loginAdmin(adminId.trim(), password);
      try {
        await getAdminSession();
      } catch {
        throw new Error(
          '로그인은 확인되었지만 관리자 세션을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
        );
      }

      const nextPath = resolveSafeAdminNext(searchParams.get('next'));
      if (nextPath !== '/admin') {
        router.replace(nextPath);
        return;
      }
      router.replace(res.role === 'SUPER_ADMIN' ? '/admin/super/credit-policies' : '/admin');
    } catch (submitError) {
      setPassword('');
      if (submitError instanceof AdminLoginError && submitError.status === 429) {
        if (submitError.retryAfterSeconds) {
          setRetryUntilMs(Date.now() + submitError.retryAfterSeconds * 1000);
        }
      }
      setError(
        submitError instanceof Error ? submitError.message : '관리자 로그인에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPage} data-testid="admin-login-page">
      <div className={styles.loginBrand}>
        초대장 관리자
        <span className={styles.envBadge}>DEVELOPMENT</span>
      </div>
      <div className={styles.loginCard}>
        <h1 className={styles.pageTitle}>관리자 로그인</h1>
        <p className={styles.pageDescription}>관리자 계정으로 로그인해 주세요.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error ? (
            <p className={styles.error} data-testid="admin-login-error" style={{ whiteSpace: 'pre-line' }}>
              {error}
            </p>
          ) : null}
          <div className={styles.field}>
            <label htmlFor="admin-id">관리자 아이디</label>
            <input
              id="admin-id"
              name="username"
              type="text"
              autoComplete="username"
              value={adminId}
              onChange={(event) => setAdminId(event.target.value)}
              required
              data-testid="admin-login-id"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-password">관리자 비밀번호</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              data-testid="admin-login-password"
            />
          </div>
          <button
            type="submit"
            className={styles.button}
            disabled={submitting || rateLimited}
            data-testid="admin-login-submit"
          >
            {submitting ? '로그인 중...' : rateLimited ? '잠시 후 다시 시도' : '로그인'}
          </button>
        </form>
        <p className={styles.loginBackLink}>
          <Link href="/">일반 서비스로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
