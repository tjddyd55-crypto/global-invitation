'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await loginAdmin(adminId, password);
      router.replace('/admin/dashboard');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : '관리자 로그인에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.pageTitle}>Super Admin Login</h1>
        <p className={styles.pageDescription}>
          `ADMIN_ID`, `ADMIN_PASSWORD` 기반으로 서버에서 검증합니다.
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="admin-id">Admin ID</label>
            <input
              id="admin-id"
              autoComplete="username"
              value={adminId}
              onChange={(event) => setAdminId(event.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-password">Admin Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
