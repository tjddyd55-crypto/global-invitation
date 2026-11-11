import type { getInvitationPricingSnapshot } from '../pricing/invitationPricing';
import type { PaymentCouponSnapshot } from './couponBridge';
import type { PaymentChannel, PaymentProviderName, TossChargeAmount } from './types';

export type PrepareInput = {
  invitationId: string;
  userId?: string | null;
  locale?: string | null;
  couponCode?: string | null;
  checkoutMethod?: unknown;
  country?: unknown;
};

export type PrepareAttemptArgs = {
  input: PrepareInput;
  pricing: Awaited<ReturnType<typeof getInvitationPricingSnapshot>>;
  provider: PaymentProviderName;
  chargedAmountCents: number;
  snapshot: PaymentCouponSnapshot | null;
  chargeAmount: TossChargeAmount;
  usdKrwRate: number | null;
  paymentChannel: PaymentChannel;
  clientKey: string | null;
  variantKey: string | null;
  settlement: 'provider' | 'zero_coupon';
};
