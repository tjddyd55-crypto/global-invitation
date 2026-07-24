'use client';
/* eslint-disable i18next/no-literal-string */

import { FormEvent } from 'react';
import { useEmailAuthFlow } from '@/src/features/auth/model/useEmailAuthFlow';
import styles from './EmailAuthForm.module.css';

/**
 * 작성자 이메일 OTP UI (Figma Make: Email Start / Email Verify).
 * 로그인·회원가입을 분리하지 않는다.
 */
export default function EmailAuthForm() {
  const {
    step,
    email,
    code,
    submitting,
    error,
    previewCode,
    setEmail,
    setCode,
    requestCode,
    verifyCode,
    resendCode,
    editEmail,
  } = useEmailAuthFlow();

  const handleEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    void requestCode();
  };

  const handleCodeSubmit = (event: FormEvent) => {
    event.preventDefault();
    void verifyCode();
  };

  if (step === 'code') {
    return (
      <section className={styles.screen} data-testid="email-verify-screen">
        <div className={styles.brandMark}>Global Invitation</div>
        <header className={styles.header}>
          <h1>인증번호를 입력해 주세요.</h1>
          <p>입력하신 이메일로 전송된 6자리 인증번호를 입력해 주세요.</p>
          <span className={styles.emailChip}>{email}</span>
        </header>

        <form className={styles.form} onSubmit={handleCodeSubmit}>
          <label className={styles.label}>
            인증번호
            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6자리 숫자"
              required
            />
          </label>

          {previewCode && <p className={styles.previewHint}>개발 미리보기 코드: {previewCode}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.primaryButton} type="submit" disabled={submitting || code.length !== 6}>
            {submitting ? '확인 중...' : '확인하고 계속하기'}
          </button>
        </form>

        <div className={styles.actions}>
          <button className={styles.secondaryButton} type="button" onClick={() => void resendCode()} disabled={submitting}>
            인증번호 다시 보내기
          </button>
          <button className={styles.ghostButton} type="button" onClick={editEmail} disabled={submitting}>
            이메일 수정
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.screen} data-testid="email-start-screen">
      <div className={styles.brandMark}>Global Invitation</div>
      <header className={styles.header}>
        <h1>초대장을 만들기 전에 이메일 인증이 필요합니다.</h1>
        <p>
          이메일 인증을 하면 초대장을 안전하게 저장하고,
          다른 기기에서도 수정할 수 있습니다.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleEmailSubmit}>
        <label className={styles.label}>
          이메일 주소
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
            inputMode="email"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.primaryButton} type="submit" disabled={submitting || !email.trim()}>
          {submitting ? '전송 중...' : '인증번호 받기'}
        </button>
      </form>
    </section>
  );
}
