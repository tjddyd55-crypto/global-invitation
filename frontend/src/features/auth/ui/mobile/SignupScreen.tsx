'use client';
/* eslint-disable i18next/no-literal-string */

import { useSignupForm } from '@/src/features/auth/model';
import styles from './SignupScreen.module.css';

// TODO(migration): /m/templates · /m/creator/dashboard 이식 완료 시 여기로 교체.
const REDIRECT_BY_ROLE = {
  USER: '/m',
  CREATOR: '/m',
} as const;

export default function SignupScreen() {
  const {
    email,
    nickname,
    password,
    role,
    submitting,
    error,
    setEmail,
    setNickname,
    setPassword,
    setRole,
    submit,
  } = useSignupForm({ redirectByRole: REDIRECT_BY_ROLE });

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>1분 안에 시작하세요.</p>
      </header>

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
            inputMode="email"
          />
        </label>

        <label className={styles.label}>
          닉네임
          <input
            className={styles.input}
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="표시될 닉네임"
            maxLength={40}
            autoComplete="nickname"
          />
        </label>

        <label className={styles.label}>
          비밀번호
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>

        <div className={styles.roleGroup} role="radiogroup" aria-label="가입 유형">
          <button
            type="button"
            className={role === 'USER' ? `${styles.roleOption} ${styles.roleOptionActive}` : styles.roleOption}
            onClick={() => setRole('USER')}
            aria-pressed={role === 'USER'}
          >
            <strong>일반 사용자</strong>
            <em>템플릿으로 바로 시작</em>
          </button>
          <button
            type="button"
            className={role === 'CREATOR' ? `${styles.roleOption} ${styles.roleOptionActive}` : styles.roleOption}
            onClick={() => setRole('CREATOR')}
            aria-pressed={role === 'CREATOR'}
          >
            <strong>크리에이터</strong>
            <em>템플릿 판매로 수익</em>
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.submitButton} type="submit" disabled={submitting}>
          {submitting ? '처리 중...' : '가입하기'}
        </button>
      </form>
    </div>
  );
}
