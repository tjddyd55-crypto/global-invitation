import type { InvitationCoupon } from '@prisma/client';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';
import { computeCouponQuote, type CouponQuote } from './calc';
import { CouponError, COUPON_ERROR_CODES } from './errors';
import { assertCouponCurrency, assertCouponLimits, assertCouponWindow, type CouponCounts } from './eligibility';

export type PublicCouponQuote = CouponQuote & {
  currency: string;
  listPriceCents: number;
  salePriceCents: number;
  code: string;
};

export async function quoteCouponAgainstCurrentPricing(
  coupon: InvitationCoupon,
  counts: CouponCounts,
  now: Date = new Date()
): Promise<PublicCouponQuote> {
  const pricing = await getInvitationPricingSnapshot();
  assertCouponWindow(coupon, now);
  assertCouponCurrency(coupon.currency, pricing.currency);
  assertCouponLimits(coupon, counts);

  const quote = computeCouponQuote({
    baseAmountCents: pricing.chargedAmountCents,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });

  if (quote.finalAmountCents < 0) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID_DISCOUNT);
  }

  return {
    ...quote,
    currency: pricing.currency,
    listPriceCents: pricing.listPriceCents,
    salePriceCents: pricing.chargedAmountCents,
    code: coupon.code,
  };
}
