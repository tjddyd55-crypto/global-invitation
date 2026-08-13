'use client';

import { useState } from 'react';
import MarketingSiteHeader from '@/src/features/marketing/ui/MarketingSiteHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import { SUPPORT_EMAIL, supportMailtoHref } from '@/src/shared/marketing/supportContact';
import { useI18n } from '@/src/contexts/I18nContext';
import styles from './ContactPage.module.css';

const TOPIC_KEYS = ['contact.topic.payment', 'contact.topic.service', 'contact.topic.bug'] as const;

export default function ContactPage() {
  const { t } = useI18n();
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
      <MarketingSiteHeader />
      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>{t('contact.heroTitle')}</h1>
          <p className={styles.heroLead}>{t('contact.heroLead')}</p>
        </header>

        <section className={styles.card} aria-labelledby="contact-email-label">
          <p id="contact-email-label" className={styles.emailLabel}>
            {t('contact.emailLabel')}
          </p>
          <a className={styles.email} href={mailto} data-testid="contact-email">
            {SUPPORT_EMAIL}
          </a>
          <a className={styles.cta} href={mailto} data-testid="contact-mailto-cta">
            {t('contact.mailtoCta')}
          </a>
          <button type="button" className={styles.copyBtn} onClick={() => void handleCopy()}>
            {copied ? t('contact.copied') : t('contact.copy')}
          </button>
          <p className={styles.hint}>{t('contact.hint')}</p>
        </section>

        <section className={styles.topics} aria-labelledby="contact-topics">
          <h2 id="contact-topics" className={styles.topicsTitle}>
            {t('contact.topicsTitle')}
          </h2>
          <ul className={styles.topicList}>
            {TOPIC_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
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
