'use client';
/* eslint-disable i18next/no-literal-string */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import AuthBrandHeader from '@/src/features/marketing/ui/AuthBrandHeader';
import InvitationDecorativeCards from '@/src/features/marketing/ui/InvitationDecorativeCards';
import { useEmailVerifyForm, formatRemaining } from '@/src/features/auth/model/useEmailVerifyForm';
import OtpCodeInputGroup from '@/src/features/auth/ui/shared/OtpCodeInputGroup';
import DevOtpPreviewPanel from '@/src/features/auth/ui/shared/DevOtpPreviewPanel';
import { ClockIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './DesktopEmailVerifyScreen.module.css';

/**
 * Figma Make `DesktopEmailVerifyScreen` — MCP 소스 구조/카피 SSOT.
 */
export default function DesktopEmailVerifyScreen() {
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
  const [resent, setResent] = useState(false);

  if (!email) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void verify();
  };

  const handleResend = async () => {
    await resend();
    setResent(true);
    window.setTimeout(() => setResent(false), 3000);
  };

  const urgent = remainingSeconds < 60;
  const expired = remainingSeconds === 0;

  return (
    <div className={styles.page} data-testid="desktop-email-verify">
      <InvitationDecorativeCards />
      <AuthBrandHeader variant="corner" />

      <div className={styles.card}>
        <h1 className={styles.title}>인증번호를 입력해 주세요</h1>
        <p className={styles.desc}>입력하신 이메일로 전송된 6자리 인증번호를 입력해 주세요.</p>
        <span className={styles.emailChip}>{email}</span>

        <form className={styles.form} onSubmit={handleSubmit}>
          <OtpCodeInputGroup
            value={code}
            onChange={setCode}
            disabled={submitting}
            hasError={Boolean(error)}
            size="desktop"
          />

          <div className={`${styles.timerRow} ${urgent ? styles.timerUrgent : ''}`}>
            <ClockIcon size={14} />
            <span>
              {expired
                ? '인증번호가 만료되었습니다'
                : `인증번호는 ${formatRemaining(remainingSeconds)} 동안 유효합니다.`}
            </span>
          </div>

          {previewCode && (
            <DevOtpPreviewPanel
              previewCode={previewCode}
              variant="verify"
              onFillInputs={(value) => setCode(value)}
            />
          )}
          {error && <p className={styles.error}>{error}</p>}
          {resent && !error && <p className={styles.resent}>✓ 인증번호가 재발송되었습니다.</p>}

          <button
            type="submit"
            className={`${styles.submitButton} ${isCodeComplete ? styles.submitButtonActive : ''}`}
            disabled={submitting || !isCodeComplete}
            data-testid="email-verify-submit"
          >
            {submitting ? '확인 중...' : '확인하고 계속하기'}
          </button>
        </form>

        <div className={styles.actions}>
          <button type="button" className={styles.resendButton} onClick={() => void handleResend()} disabled={submitting}>
            인증번호 다시 보내기
          </button>
          <span className={styles.divider} aria-hidden>
            |
          </span>
          <Link href={editEmailHref} className={styles.editLink}>
            이메일 수정
          </Link>
        </div>
      </div>

      <Link href={editEmailHref} className={styles.backLink}>
        ← 이전 단계로
      </Link>
    </div>
  );
}
