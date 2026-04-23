'use client';
/* eslint-disable i18next/no-literal-string */

import { useSignupForm, CREATOR_BENEFITS } from '@/src/features/auth/model';
import styles from './SignupCard.module.css';

// TODO(migration): /pc/templates · /pc/creator/dashboard 이식 완료 시 여기로 교체.
const REDIRECT_BY_ROLE = {
  USER: '/pc',
  CREATOR: '/pc',
} as const;

export default function SignupCard() {
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
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>가입 유형을 선택하고 1분 안에 시작하세요.</p>

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
              placeholder="8자 이상 입력"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>

          <fieldset className={styles.roleFieldset}>
            <legend className={styles.legend}>가입 유형</legend>
            <label className={role === 'USER' ? `${styles.roleOption} ${styles.roleOptionActive}` : styles.roleOption}>
              <input
                type="radio"
                name="signup-role"
                value="USER"
                checked={role === 'USER'}
                onChange={() => setRole('USER')}
              />
              <span>
                <strong>일반 사용자</strong>
                <em>템플릿을 선택하고 바로 초대장을 제작합니다.</em>
              </span>
            </label>
            <label className={role === 'CREATOR' ? `${styles.roleOption} ${styles.roleOptionActive}` : styles.roleOption}>
              <input
                type="radio"
                name="signup-role"
                value="CREATOR"
                checked={role === 'CREATOR'}
                onChange={() => setRole('CREATOR')}
              />
              <span>
                <strong>크리에이터</strong>
                <em>직접 만든 템플릿을 공개하고 수익을 창출합니다.</em>
              </span>
            </label>
          </fieldset>

          <div className={role === 'CREATOR' ? `${styles.creatorInfo} ${styles.creatorInfoActive}` : styles.creatorInfo}>
            <p className={styles.creatorHeadline}>
              크리에이터는 템플릿을 제작하여
              <br />
              사용자가 사용할 때마다 수익을 얻을 수 있습니다.
            </p>
            <ul className={styles.creatorBenefitList}>
              {CREATOR_BENEFITS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitButton} type="submit" disabled={submitting}>
            {submitting ? '가입 처리 중...' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
