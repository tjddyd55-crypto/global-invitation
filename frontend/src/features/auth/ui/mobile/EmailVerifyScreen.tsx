'use client';
/* eslint-disable i18next/no-literal-string */

import type { FormEvent } from 'react';
import Link from 'next/link';
import AuthBrandHeader from '@/src/features/marketing/ui/AuthBrandHeader';
import { useEmailVerifyForm, formatRemaining } from '@/src/features/auth/model/useEmailVerifyForm';
import OtpCodeInputGroup from '@/src/features/auth/ui/shared/OtpCodeInputGroup';
import { ArrowRightIcon, ClockIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './EmailVerifyScreen.module.css';

/**
 * Figma Make `EmailVerifyScreen` — canonical `/auth/verify` 모바일 (OTP 경로).
 */
export default function EmailVerifyScreen() {
  const {
    email,
    code,
    submitting,
    error,
    previewCode,
    remainingSeconds,
    isCodeComplete,
    setCode,
    verify,
    resend,
    editEmailHref,
  } = useEmailVerifyForm();

  if (!email) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void verify();
  };

  const expired = remainingSeconds === 0;

  return (
    <div className={styles.screen} data-testid="email-verify-screen">
      <div className={styles.topBar}>
        <AuthBrandHeader />
      </div>

      <div className={styles.body}>
        <h1 className={styles.title}>인증번호를 입력해 주세요</h1>
        <p className={styles.desc}>아래 이메일로 전송된 6자리 인증번호를 입력해 주세요.</p>
        <span className={styles.emailChip}>{email}</span>

        <form className={styles.form} onSubmit={handleSubmit}>
          <OtpCodeInputGroup value={code} onChange={setCode} disabled={submitting} hasError={Boolean(error)} />

          <div className={styles.timerRow}>
            <ClockIcon size={14} />
            <span className={expired ? styles.timerExpired : undefined}>
              {expired ? '인증번호가 만료되었습니다' : `남은 시간 ${formatRemaining(remainingSeconds)}`}
            </span>
          </div>

          {previewCode && <p className={styles.previewHint}>개발 미리보기 코드: {previewCode}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={`${styles.submitButton} ${isCodeComplete ? styles.submitButtonActive : ''}`}
            disabled={submitting || !isCodeComplete}
            data-testid="email-verify-submit"
          >
            {submitting ? '확인 중...' : '확인하고 계속하기'}
            <ArrowRightIcon size={16} />
          </button>
        </form>

        <div className={styles.actions}>
          <button type="button" className={styles.resendButton} onClick={() => void resend()} disabled={submitting}>
            인증번호 다시 보내기
          </button>
          <Link href={editEmailHref} className={styles.editLink}>
            이메일 변경
          </Link>
        </div>
      </div>
    </div>
  );
}
