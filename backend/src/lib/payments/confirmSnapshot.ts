import type { InvitationCouponDiscountType, InvitationCouponUsageStatus } from '@prisma/client';
import { PAYMENT_ERROR_CODES } from './errors';

export type ConfirmPaymentSnapshot = {
  couponId?: string | null;
  couponCode?: string | null;
  couponDiscountType?: InvitationCouponDiscountType | null;
  couponDiscountValue?: number | null;
  chargedAmount: number;
  currency: string;
};

export type ConfirmUsageSnapshot = {
  status: InvitationCouponUsageStatus | string;
  codeSnapshot: string;
  discountType: InvitationCouponDiscountType | string;
  discountValue: number;
  finalAmountCents: number;
  expiresAt?: Date | null;
};

export function assertPreparedAmountMatch(
  expectedProviderAmount: number | null,
  clientAmount: number
): { ok: true } | { ok: false; code: 'AMOUNT_MISMATCH' } {
  if (expectedProviderAmount === null || clientAmount !== expectedProviderAmount) {
    return { ok: false, code: PAYMENT_ERROR_CODES.AMOUNT_MISMATCH };
  }
  return { ok: true };
}

export function assertPreparedCurrencyMatch(
  expectedCurrency: string,
  actualCurrency?: string | null
): { ok: true } | { ok: false; code: 'CURRENCY_MISMATCH' } {
  if (!actualCurrency) return { ok: true };
  if (actualCurrency.toUpperCase() !== expectedCurrency.toUpperCase()) {
    return { ok: false, code: PAYMENT_ERROR_CODES.CURRENCY_MISMATCH };
  }
  return { ok: true };
}

/**
 * Confirm honors the payment/usage snapshot for the pending window.
 * Live coupon ACTIVE/PAUSED is not re-checked here.
 */
export function matchCouponSnapshotAtConfirm(
  payment: ConfirmPaymentSnapshot,
  usage: ConfirmUsageSnapshot | null,
  now: Date = new Date()
): { ok: true } | { ok: false; code: 'COUPON_SNAPSHOT_MISMATCH' | 'RESERVATION_EXPIRED' } {
  if (!payment.couponId) return { ok: true };
  if (!usage || usage.status !== 'RESERVED') {
    return { ok: false, code: PAYMENT_ERROR_CODES.COUPON_SNAPSHOT_MISMATCH };
  }
  if (usage.expiresAt && usage.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, code: PAYMENT_ERROR_CODES.RESERVATION_EXPIRED };
  }
  if (usage.finalAmountCents !== payment.chargedAmount) {
    return { ok: false, code: PAYMENT_ERROR_CODES.COUPON_SNAPSHOT_MISMATCH };
  }
  if (usage.codeSnapshot !== (payment.couponCode || '')) {
    return { ok: false, code: PAYMENT_ERROR_CODES.COUPON_SNAPSHOT_MISMATCH };
  }
  if (usage.discountType !== payment.couponDiscountType) {
    return { ok: false, code: PAYMENT_ERROR_CODES.COUPON_SNAPSHOT_MISMATCH };
  }
  if (usage.discountValue !== payment.couponDiscountValue) {
    return { ok: false, code: PAYMENT_ERROR_CODES.COUPON_SNAPSHOT_MISMATCH };
  }
  return { ok: true };
}
