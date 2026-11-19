'use client';

import Link from 'next/link';
import { useI18n } from '@/src/contexts/I18nContext';
import styles from './PaymentPage.module.css';

type Props = {
  checked: boolean;
  disabled: boolean;
  required: boolean;
  onChange: (checked: boolean) => void;
};

export default function PaymentDigitalConsent({ checked, disabled, required, onChange }: Props) {
  const { t } = useI18n();
  return (
    <section className={styles.card} aria-labelledby="payment-refund-notice-title">
      <h2 id="payment-refund-notice-title" className={styles.summaryTitle}>{t('checkout.refund.title')}</h2>
      <p id="payment-refund-notice" className={styles.consentNotice}>{t('checkout.refund.notice')}</p>
      <Link href="/refund-policy" target="_blank" rel="noopener noreferrer" data-testid="payment-refund-policy-link">
        {t('marketing.footer.refund')}
      </Link>
      {required ? (
        <label className={styles.consentLabel}>
          <input type="checkbox" checked={checked} disabled={disabled} required
            aria-describedby="payment-refund-notice" data-testid="payment-digital-consent"
            onChange={(event) => onChange(event.target.checked)} />
          <span>{t('checkout.refund.consent')}</span>
        </label>
      ) : null}
    </section>
  );
}
