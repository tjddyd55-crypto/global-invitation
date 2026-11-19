'use client';

import MarketingLayout from '@/src/components/MarketingLayout';
import MarketingSiteHeader from '@/src/features/marketing/ui/MarketingSiteHeader';
import { useI18n } from '@/src/contexts/I18nContext';
import { interpolate } from '@/src/i18n';
import { SUPPORT_EMAIL, supportMailtoHref } from '@/src/shared/marketing/supportContact';
import { INVITATION_PRICING, formatUsdAmountLabel } from '@/src/shared/pricing/invitationPricing';
import styles from '@/src/components/MarketingContent.module.css';

const POLICY_SECTIONS = ['unused', 'provision', 'errors', 'processing', 'planned', 'rights'] as const;

function RefundPolicyContent() {
  const { t } = useI18n();
  const pricing = { list: formatUsdAmountLabel(INVITATION_PRICING.listPriceCents),
    sale: formatUsdAmountLabel(INVITATION_PRICING.salePriceCents) };
  return (
    <article className={styles.section} data-testid="refund-policy-page">
      <h1 className={styles.title}>{t('refund.title')}</h1>
      <p className={styles.subtitle}>{t('refund.intro')}</p>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('refund.current.title')}</h2>
        <p className={styles.cardText}>{interpolate(t('refund.current.body'), pricing)}</p>
      </section>
      {POLICY_SECTIONS.map((section) => (
        <section key={section} className={styles.note}>
          <h2 className={styles.cardTitle}>{t(`refund.${section}.title`)}</h2>
          <p className={styles.cardText}>{t(`refund.${section}.body`)}</p>
        </section>
      ))}
      <section className={styles.note}>
        <h2 className={styles.cardTitle}>{t('refund.request.title')}</h2>
        <p className={styles.cardText}>{t('refund.request.body')}</p>
        <a className={styles.link} href={supportMailtoHref(t('refund.title'))}>{SUPPORT_EMAIL}</a>
      </section>
    </article>
  );
}

export default function RefundPolicyPage() {
  return (
    <>
      <MarketingSiteHeader />
      <MarketingLayout><RefundPolicyContent /></MarketingLayout>
    </>
  );
}
