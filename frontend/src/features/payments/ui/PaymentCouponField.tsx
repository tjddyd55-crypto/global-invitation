'use client';

import { useState } from 'react';
import { useI18n } from '@/src/contexts/I18nContext';
import { validateInvitationCoupon, type CouponQuoteResponse } from '@/src/shared/payments/invitationCouponApi';
import { formatUsdFromCents } from '@/src/shared/pricing/invitationPricing';
import styles from './PaymentPage.module.css';

export type AppliedCoupon = {
  code: string;
  quote: CouponQuoteResponse;
};

type Props = {
  invitationId: string;
  applied: AppliedCoupon | null;
  disabled?: boolean;
  onApplied: (applied: AppliedCoupon) => void;
  onRemoved: () => void;
};

const COUPON_MESSAGE_KEYS: Record<string, string> = {
  COUPON_INVALID: 'checkout.coupon.error.invalid',
  COUPON_INACTIVE: 'checkout.coupon.error.inactive',
  COUPON_NOT_STARTED: 'checkout.coupon.error.notStarted',
  COUPON_EXPIRED: 'checkout.coupon.error.expired',
  COUPON_LIMIT_REACHED: 'checkout.coupon.error.limit',
  COUPON_USER_LIMIT_REACHED: 'checkout.coupon.error.userLimit',
  COUPON_ALREADY_PAID: 'checkout.coupon.error.alreadyPaid',
  COUPON_RATE_LIMITED: 'checkout.coupon.error.rateLimited',
};

export default function PaymentCouponField({
  invitationId,
  applied,
  disabled,
  onApplied,
  onRemoved,
}: Props) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    setBusy(true);
    setError(null);
    try {
      const quote = await validateInvitationCoupon(invitationId, code);
      onApplied({ code: code.trim().toUpperCase(), quote });
    } catch (err) {
      const key = err instanceof Error ? COUPON_MESSAGE_KEYS[err.message] : null;
      setError(t(key || 'checkout.coupon.error.invalid'));
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <section className={styles.card} aria-label={t('checkout.coupon.aria')}>
        <div className={styles.priceRow}>
          <span className={styles.discount}>{t('checkout.coupon.applied')}</span>
          <span className={styles.discount}>{applied.code}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.discount}>{t('checkout.coupon.discount')}</span>
          <span className={styles.discount}>-{formatUsdFromCents(applied.quote.discountAmountCents)}</span>
        </div>
        <button type="button" className={styles.secondary} disabled={disabled} onClick={onRemoved}>
          {t('checkout.coupon.remove')}
        </button>
      </section>
    );
  }

  return (
    <section className={styles.card} aria-label={t('checkout.coupon.aria')}>
      <label className={styles.summaryTitle} htmlFor="coupon-code">
        {t('checkout.coupon.label')}
      </label>
      <div className={styles.couponRow}>
        <input
          id="coupon-code"
          className={styles.couponInput}
          value={code}
          disabled={disabled || busy}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder={t('checkout.coupon.placeholder')}
          onChange={(event) => setCode(event.target.value)}
        />
        <button type="button" className={styles.secondary} disabled={disabled || busy || !code.trim()} onClick={() => void handleApply()}>
          {t('checkout.coupon.apply')}
        </button>
      </div>
      {error ? <p className={styles.couponError}>{error}</p> : null}
    </section>
  );
}
