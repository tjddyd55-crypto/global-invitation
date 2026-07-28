'use client';
/* eslint-disable i18next/no-literal-string */

import type { FormEvent } from 'react';
import Link from 'next/link';
import AuthBrandHeader from '@/src/features/marketing/ui/AuthBrandHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import { useEmailStartForm } from '@/src/features/auth/model/useEmailStartForm';
import DevOtpPreviewPanel from '@/src/features/auth/ui/shared/DevOtpPreviewPanel';
import { ArrowRightIcon, ChevronLeftIcon, MailIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './EmailStartScreen.module.css';

/**
 * Figma Make `EmailStartScreen` — MCP 소스 구조/카피 SSOT.
 */
export default function EmailStartScreen() {
  const {
    email,
    submitting,
    error,
    isValidEmail,
    previewCode,
    codeSent,
    setEmail,
    submit,
  } = useEmailStartForm();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  return (
    <div className={styles.screen} data-testid="email-start-screen">
      <div className={styles.topBar}>
        <Link href="/" className={styles.backButton} aria-label="홈으로">
          <ChevronLeftIcon size={20} />
        </Link>
        <AuthBrandHeader variant="inline" />
      </div>

      <div className={styles.body}>
        <div className={styles.card}>
          <span className={styles.iconBadge}>
            <MailIcon size={24} />
          </span>

          <h1 className={styles.title}>
            초대장을 만들기 전에
            <br />
            이메일 인증이 필요합니다.
          </h1>

          <p className={styles.desc}>
            이메일 인증을 하면 초대장을 안전하게 저장하고, 다른 기기에서도 수정할 수 있습니다.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="auth-email-input-m">
              이메일 주소
            </label>
            <input
              id="auth-email-input-m"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일 주소를 입력하세요"
              autoComplete="email"
              inputMode="email"
              required
              disabled={codeSent}
            />
            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={`${styles.submitButton} ${isValidEmail || codeSent ? styles.submitButtonActive : ''}`}
              disabled={submitting || (!isValidEmail && !codeSent)}
              data-testid="email-start-submit"
            >
              {submitting ? '전송 중...' : codeSent ? '인증번호 확인하기' : '인증번호 받기'}
              <ArrowRightIcon size={18} />
            </button>
          </form>

          {previewCode && <DevOtpPreviewPanel previewCode={previewCode} variant="start" />}
        </div>

        <div className={styles.policyBox}>
          <p>
            <span className={styles.policyCheck}>✓</span> 회원가입과 로그인을 따로 구분하지 않습니다. 인증 후 기존
            계정이면 로그인되고, 처음이면 자동으로 계정이 생성됩니다.
          </p>
        </div>
        <SiteBusinessFooter />
      </div>
    </div>
  );
}
