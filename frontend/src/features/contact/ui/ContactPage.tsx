'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import { SUPPORT_EMAIL, supportMailtoHref } from '@/src/shared/marketing/supportContact';
import styles from './ContactPage.module.css';

const TOPICS = ['결제 관련 문의', '서비스 이용 문의', '오류 신고'] as const;

/**
 * Contact — mailto contract 유지 (form/API 없음, fake success 금지).
 */
export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const mailto = supportMailtoHref();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.page} data-testid="contact-page">
      <MarketingDesktopHeader />
      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>문의하기</h1>
          <p className={styles.heroLead}>서비스 이용 중 궁금한 점이 있으면 문의해 주세요.</p>
        </header>

        <section className={styles.card} aria-labelledby="contact-email-label">
          <p id="contact-email-label" className={styles.emailLabel}>
            문의 이메일
          </p>
          <a className={styles.email} href={mailto} data-testid="contact-email">
            {SUPPORT_EMAIL}
          </a>
          <a className={styles.cta} href={mailto} data-testid="contact-mailto-cta">
            이메일로 문의하기
          </a>
          <button type="button" className={styles.copyBtn} onClick={() => void handleCopy()}>
            {copied ? '복사됨' : '이메일 주소 복사'}
          </button>
          <p className={styles.hint}>메일 앱이 열립니다. 웹에서 문의 접수를 대신하지 않습니다.</p>
        </section>

        <section className={styles.topics} aria-labelledby="contact-topics">
          <h2 id="contact-topics" className={styles.topicsTitle}>
            이런 내용을 문의할 수 있어요
          </h2>
          <ul className={styles.topicList}>
            {TOPICS.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </section>
      </main>
      <div className={styles.footerWrap}>
        <SiteBusinessFooter />
      </div>
    </div>
  );
}
