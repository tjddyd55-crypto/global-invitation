'use client';

import Link from 'next/link';
import MarketingSiteHeader from '@/src/features/marketing/ui/MarketingSiteHeader';
import { useI18n } from '@/src/contexts/I18nContext';
import { interpolate } from '@/src/i18n';
import { SUPPORT_EMAIL, supportMailtoHref } from '@/src/shared/marketing/supportContact';
import { INVITATION_PRICING, formatUsdAmountLabel } from '@/src/shared/pricing/invitationPricing';
import styles from './page.module.css';

const SECTIONS = ['overview', 'how', 'pricing', 'refund', 'support'] as const;

function PaymentInfoContent() {
  const { t } = useI18n();
  const pricing = {
    list: formatUsdAmountLabel(INVITATION_PRICING.listPriceCents),
    sale: formatUsdAmountLabel(INVITATION_PRICING.salePriceCents),
  };
  return (
    <main className={styles.container} data-testid="payment-info-page">
      <h1>{t('paymentInfo.title')}</h1>
      {SECTIONS.map((section) => (
        <section key={section} className={styles.section} data-testid={`payment-info-${section}`}>
          <h2>{t(`paymentInfo.${section}.title`)}</h2>
          <p>{interpolate(t(`paymentInfo.${section}.body`), pricing)}</p>
          {section === 'overview' && <p>{t('paymentInfo.overview.digital')}</p>}
          {section === 'pricing' && <p>{t('paymentInfo.pricing.edit')}</p>}
          {section === 'refund' && <Link href="/refund-policy">{t('refund.title')}</Link>}
          {section === 'support' && <a href={supportMailtoHref()}>{SUPPORT_EMAIL}</a>}
        </section>
      ))}
    </main>
  );
}

export default function PaymentInfoPage() {
  return <><MarketingSiteHeader /><PaymentInfoContent /></>;
}
