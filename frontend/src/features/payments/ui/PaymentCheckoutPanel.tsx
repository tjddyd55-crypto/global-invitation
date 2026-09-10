'use client';

import { useI18n } from '@/src/contexts/I18nContext';
import { formatUsdAmountLabel, formatUsdFromCents } from '@/src/shared/pricing/invitationPricing';
import PaymentCouponField, { type AppliedCoupon } from './PaymentCouponField';
import styles from './PaymentPage.module.css';

type Props = {
  invitationId: string;
  title: string;
  templateKey?: string | null;
  listCents: number;
  saleCents: number;
  applied: AppliedCoupon | null;
  busy: boolean;
  providerChargeReady: boolean;
  unavailableMessage: string | null;
  onApplied: (applied: AppliedCoupon) => void;
  onRemoved: () => void;
  onCheckout: () => void;
};

export default function PaymentCheckoutPanel({
  invitationId,
  title,
  templateKey,
  listCents,
  saleCents,
  applied,
  busy,
  providerChargeReady,
  unavailableMessage,
  onApplied,
  onRemoved,
  onCheckout,
}: Props) {
  const { t } = useI18n();
  const dueCents = applied?.quote.finalAmountCents ?? saleCents;
  const list = formatUsdAmountLabel(listCents);
  const sale = formatUsdAmountLabel(saleCents);
  const discount = formatUsdFromCents(listCents - saleCents);
  const due = formatUsdAmountLabel(dueCents);
  const chargeBlocked = dueCents > 0 && !providerChargeReady;
  const ctaLabel = chargeBlocked
    ? t('checkout.cta.unavailable')
    : dueCents === 0
      ? `${t('checkout.cta.publishFree')}`
      : `${due} · ${t('checkout.cta.payPublish')}`;

  return (
    <>
      <h1 className={styles.headerTitle}>{t('checkout.title')}</h1>
      <p className={styles.headerDesc}>{t('checkout.lead')}</p>

      <section className={styles.card} aria-label={t('checkout.summaryAria')}>
        <h2 className={styles.summaryTitle}>{title}</h2>
        <p className={styles.summaryMeta}>{templateKey}</p>
      </section>

      <section className={styles.card} aria-label={t('checkout.priceAria')}>
        <div className={styles.priceRow}>
          <span className={styles.muted}>{t('checkout.listPrice')}</span>
          <span aria-label={`${t('checkout.listPrice')} ${list}`}>{list}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.discount}>{t('checkout.launchPrice')}</span>
          <span className={styles.discount} aria-label={`${t('checkout.launchPrice')} -${discount}`}>
            -{discount}
          </span>
        </div>
        {applied ? (
          <div className={styles.priceRow}>
            <span className={styles.discount}>{t('checkout.coupon.discount')}</span>
            <span className={styles.discount}>-{formatUsdFromCents(applied.quote.discountAmountCents)}</span>
          </div>
        ) : null}
        <div className={styles.priceRowTotal}>
          <span>{t('checkout.due')}</span>
          <span aria-label={`${t('checkout.due')} ${due}`}>{due}</span>
        </div>
      </section>

      {unavailableMessage && chargeBlocked ? (
        <p className={styles.unavailableBanner} role="status">
          {unavailableMessage}
        </p>
      ) : null}

      <PaymentCouponField
        invitationId={invitationId}
        applied={applied}
        disabled={busy}
        onApplied={onApplied}
        onRemoved={onRemoved}
      />

      <section className={styles.card} aria-label={t('checkout.benefitsAria')}>
        <ul className={styles.benefits}>
          <li>{t('checkout.benefit.publish')}</li>
          <li>{t('checkout.benefit.edit')}</li>
          <li>{t('checkout.benefit.once')}</li>
        </ul>
        <p className={styles.muted} style={{ marginTop: 12, marginBottom: 0, fontSize: '0.8125rem' }}>
          {t('checkout.providerNote')}
        </p>
      </section>

      <div className={styles.stickyBar}>
        <div className={styles.stickyInner}>
          <button
            type="button"
            className={styles.primary}
            style={{ width: '100%' }}
            disabled={busy || chargeBlocked}
            data-testid="payment-checkout-cta"
            onClick={onCheckout}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </>
  );
}
