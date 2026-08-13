'use client';
/* eslint-disable i18next/no-literal-string */

import { FormEvent } from 'react';
import { useEmailAuthFlow } from '@/src/features/auth/model/useEmailAuthFlow';
import { useI18n } from '@/src/contexts/I18nContext';
import { interpolate } from '@/src/i18n';
import styles from './EmailAuthForm.module.css';

export default function EmailAuthForm() {
  const { t } = useI18n();
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
        {/* eslint-disable-next-line i18next/no-literal-string -- brand name */}
        <div className={styles.brandMark}>Global Invitation</div>
        <header className={styles.header}>
          <h1>{t('auth.code.title')}</h1>
          <p>{t('auth.code.subtitle')}</p>
          <span className={styles.emailChip}>{email}</span>
        </header>

        <form className={styles.form} onSubmit={handleCodeSubmit}>
          <label className={styles.label}>
            {t('auth.code.label')}
            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('auth.code.placeholder')}
              required
            />
          </label>

          {previewCode && (
            <p className={styles.previewHint}>{interpolate(t('auth.code.preview'), { code: previewCode })}</p>
          )}
          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.primaryButton} type="submit" disabled={submitting || code.length !== 6}>
            {submitting ? t('auth.code.submitting') : t('auth.code.submit')}
          </button>
        </form>

        <div className={styles.actions}>
          <button className={styles.secondaryButton} type="button" onClick={() => void resendCode()} disabled={submitting}>
            {t('auth.code.resend')}
          </button>
          <button className={styles.ghostButton} type="button" onClick={editEmail} disabled={submitting}>
            {t('auth.code.editEmail')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.screen} data-testid="email-start-screen">
      <div className={styles.brandMark}>Global Invitation</div>
      <header className={styles.header}>
        <h1>{t('auth.email.title')}</h1>
        <p>{t('auth.email.subtitle')}</p>
      </header>

      <form className={styles.form} onSubmit={handleEmailSubmit}>
        <label className={styles.label}>
          {t('auth.email.label')}
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('auth.email.placeholder')}
            required
            autoComplete="email"
            inputMode="email"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.primaryButton} type="submit" disabled={submitting || !email.trim()}>
          {submitting ? t('auth.email.submitting') : t('auth.email.submit')}
        </button>
      </form>
    </section>
  );
}
