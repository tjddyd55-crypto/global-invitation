'use client';

import MarketingLayout from '@/src/components/MarketingLayout';
import styles from '@/src/components/MarketingContent.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

const SUPPORT_EMAIL = 'tjddyd55@gmail.com';

export default function ContactPage() {
  const { t } = useI18n();

  return (
    <MarketingLayout>
      <section className={styles.section}>
        <h1 className={styles.title}>{t(I18N_KEYS.marketing.contactTitle)}</h1>
        <p className={styles.subtitle}>{t(I18N_KEYS.marketing.contactSubtitle)}</p>
        <div className={styles.infoRow}>
          <strong>{t(I18N_KEYS.marketing.contactEmailLabel)}</strong>
          <a className={styles.link} href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
