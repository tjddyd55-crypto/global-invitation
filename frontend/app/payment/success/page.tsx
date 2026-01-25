'use client';

import Link from 'next/link';
import MarketingLayout from '@/src/components/MarketingLayout';
import styles from '@/src/components/MarketingContent.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

export default function PaymentSuccessPage() {
  const { t } = useI18n();

  return (
    <MarketingLayout>
      <section className={styles.section}>
        <h1 className={styles.title}>{t(I18N_KEYS.payment.successTitle)}</h1>
        <p className={styles.subtitle}>{t(I18N_KEYS.payment.successDescription)}</p>
        <Link className={styles.link} href="/">
          {t(I18N_KEYS.payment.backHome)}
        </Link>
      </section>
    </MarketingLayout>
  );
}
