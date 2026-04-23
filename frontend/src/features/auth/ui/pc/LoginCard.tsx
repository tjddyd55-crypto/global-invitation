'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useLoginForm } from '@/src/features/auth/model';
import styles from './LoginCard.module.css';

/**
 * PC 로그인 카드.
 * - 폼 로직은 `useLoginForm` 이 담당.
 * - 이 컴포넌트는 UI 와 에러 표시만.
 */
export default function LoginCard() {
  const { email, password, submitting, error, setEmail, setPassword, submit } = useLoginForm();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.subtitle}>이메일과 비밀번호로 로그인하세요.</p>

        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label}>
            이메일
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className={styles.label}>
            비밀번호
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitButton} type="submit" disabled={submitting}>
            {submitting ? '로그인 처리 중...' : '로그인'}
          </button>
        </form>

        <p className={styles.linkLine}>
          계정이 없나요? <Link href="/pc/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
