import type { CheckoutMethod } from '@/src/shared/payments/tossCheckoutMethod';
import type { InvitationPaymentSummaryResponse } from '@/src/shared/payments/invitationPaymentApi';
import type { CouponQuoteResponse } from '@/src/shared/payments/invitationCouponApi';

export type RestoredCoupon = {
  code: string;
  quote: CouponQuoteResponse;
};

export const PROVIDER_UNAVAILABLE_CODES = new Set([
  'TOSS_KEY_MISMATCH',
  'TOSS_LIVE_KEY_FORBIDDEN_IN_TEST',
  'TOSS_TEST_KEY_FORBIDDEN_IN_PRODUCTION',
  'TOSS_LIVE_KEY_FORBIDDEN_IN_NON_PRODUCTION',
  'PAYMENT_PROVIDER_NOT_CONFIGURED',
  'PAYMENT_SERVICE_NOT_AVAILABLE',
  'FOREIGN_MID_NOT_CONFIGURED',
  'MISSING_TOSS_KEYS',
  'PAYMENT_PROVIDER_CONFIG_INVALID',
  'PAYMENTS_DISABLED',
  'DOMESTIC_KRW_DISABLED',
  'DOMESTIC_KRW_RATE_NOT_CONFIGURED',
  'UNSUPPORTED_CURRENCY',
  'LIVE_PAYMENT_BLOCKED_IN_DEVELOPMENT',
]);

export function isProviderUnavailableCode(code: string | null | undefined): boolean {
  return Boolean(code && PROVIDER_UNAVAILABLE_CODES.has(code));
}

export function canStartCheckout(input: {
  providerChargeReady: boolean;
  dueCents: number;
}): boolean {
  return input.dueCents === 0 || input.providerChargeReady;
}

export function canSubmitCheckout(input: {
  providerChargeReady: boolean;
  dueCents: number;
  digitalConsent: boolean;
  busy: boolean;
}): boolean {
  return !input.busy && canStartCheckout(input) && (input.dueCents === 0 || input.digitalConsent);
}

export function restorePendingCoupon(
  data: InvitationPaymentSummaryResponse
): RestoredCoupon | null {
  if (data.payment.isPaid || data.payment.latestStatus !== 'PENDING') return null;
  if (!data.payment.couponCode || data.payment.chargedAmountCents == null) return null;
  return {
    code: data.payment.couponCode,
    quote: {
      ok: true,
      currency: data.pricing.currency,
      listPriceCents: data.pricing.listPriceCents,
      salePriceCents: data.pricing.salePriceCents,
      discountAmountCents: data.payment.discountAmountCents || 0,
      finalAmountCents: data.payment.chargedAmountCents,
    },
  };
}

export function resolveCheckoutSelection(choice: CheckoutMethod | null, browserLocale: string): CheckoutMethod {
  return choice ?? (browserLocale.toLowerCase().startsWith('ko') ? 'DOMESTIC' : 'OVERSEAS_CARD');
}
