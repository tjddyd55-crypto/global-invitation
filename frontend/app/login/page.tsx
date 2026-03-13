'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarketingLayout from '@/src/components/MarketingLayout';
import { loginWithPassword, setStoredSession } from '@/src/lib/auth';
import { loginAdmin } from '@/src/lib/adminApi';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (result.user.role === 'CREATOR') {
        router.replace('/creator/dashboard');
        return;
      }
      if (result.user.role === 'ADMIN') {
        router.replace('/admin');
        return;
      }
      router.replace('/templates');
    } catch (loginError) {
      try {
        await loginAdmin(email.trim(), password);
        router.replace('/admin/dashboard');
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
