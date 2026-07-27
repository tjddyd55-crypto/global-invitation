'use client';
/* eslint-disable i18next/no-literal-string */

import type { FormEvent } from 'react';
import AuthBrandHeader from '@/src/features/marketing/ui/AuthBrandHeader';
import InvitationDecorativeCards from '@/src/features/marketing/ui/InvitationDecorativeCards';
import { useEmailStartForm } from '@/src/features/auth/model/useEmailStartForm';
import { ArrowRightIcon, MailIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './DesktopEmailStartScreen.module.css';

/**
 * Figma Make `DesktopEmailStartScreen` — canonical `/auth/email` 데스크톱 (`>=1024px`).
 */
export default function DesktopEmailStartScreen() {
  const { email, submitting, error, isValidEmail, setEmail, submit } = useEmailStartForm();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  return (
    <div className={styles.page}>
      <InvitationDecorativeCards />

      <div className={styles.content}>
        <AuthBrandHeader />

        <div className={styles.card}>
          <span className={styles.iconBadge}>
            <MailIcon size={22} />
          </span>
          <h1 className={styles.title}>초대장을 만들기 전에 이메일 인증이 필요합니다</h1>
          <p className={styles.desc}>
            이메일 인증을 하면 초대장을 안전하게 저장하고, 다른 기기에서도 이어서 수정할 수 있습니다.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="auth-email-input">
              이메일 주소
            </label>
            <input
              id="auth-email-input"
              className={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              inputMode="email"
              required
            />

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={`${styles.submitButton} ${isValidEmail ? styles.submitButtonActive : ''}`}
              disabled={submitting || !isValidEmail}
              data-testid="email-start-submit"
            >
              {submitting ? '전송 중...' : '인증번호 받기'}
              <ArrowRightIcon size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
