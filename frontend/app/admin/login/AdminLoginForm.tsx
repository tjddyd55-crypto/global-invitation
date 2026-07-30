'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminSession, loginAdmin } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const adminIdCandidates = buildAdminIdCandidates(adminId);
      let authenticated = false;
      let lastError: unknown = null;
      let nextRole: 'ADMIN' | 'SUPER_ADMIN' | null = null;

      for (const candidate of adminIdCandidates) {
        try {
          const res = await loginAdmin(candidate, password);
          nextRole = res.role;
          authenticated = true;
          break;
        } catch (loginError) {
          lastError = loginError;
        }
      }

      if (!authenticated) {
        throw lastError instanceof Error
          ? lastError
          : new Error('관리자 로그인에 실패했습니다.');
      }

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
      router.replace(nextRole === 'SUPER_ADMIN' ? '/admin/super/credit-policies' : '/admin');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : '관리자 로그인에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPage} data-testid="admin-login-page">
      <div className={styles.loginBrand}>Invite Admin</div>
      <div className={styles.loginCard}>
        <h1 className={styles.pageTitle}>관리자 로그인</h1>
        <p className={styles.pageDescription}>관리자 계정으로 로그인해 주세요.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
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
          {error && (
            <p className={styles.error} data-testid="admin-login-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={styles.button}
            disabled={submitting}
            data-testid="admin-login-submit"
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className={styles.loginBackLink}>
          <Link href="/">일반 서비스로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
