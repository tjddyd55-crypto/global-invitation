import type { InvitationCouponDiscountType } from '@prisma/client';

export type CouponQuoteInput = {
  baseAmountCents: number;
  discountType: InvitationCouponDiscountType | 'PERCENT' | 'FIXED_AMOUNT';
  discountValue: number;
};

export type CouponQuote = {
  baseAmountCents: number;
  discountAmountCents: number;
  finalAmountCents: number;
};

function assertPositiveInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`INVALID_${label}`);
  }
}

/**
 * Server-side coupon quote. Amounts are USD cents (minor units).
 * Discount never exceeds the sale-price base. 100% / oversized FIXED → $0.
 */
export function computeCouponQuote(input: CouponQuoteInput): CouponQuote {
  assertPositiveInt(input.baseAmountCents, 'BASE_AMOUNT');
  assertPositiveInt(input.discountValue, 'DISCOUNT_VALUE');

  const discountAmountCents = computeDiscountAmount(input);
  const finalAmountCents = Math.max(0, input.baseAmountCents - discountAmountCents);

  return {
    baseAmountCents: input.baseAmountCents,
    discountAmountCents: input.baseAmountCents - finalAmountCents,
    finalAmountCents,
  };
}

function computeDiscountAmount(input: CouponQuoteInput): number {
  if (input.discountType === 'PERCENT') {
    if (input.discountValue < 1 || input.discountValue > 100) {
      throw new Error('INVALID_PERCENT_VALUE');
    }
    return Math.floor((input.baseAmountCents * input.discountValue) / 100);
  }

  if (input.discountType === 'FIXED_AMOUNT') {
    return Math.min(input.discountValue, input.baseAmountCents);
  }

  throw new Error('INVALID_DISCOUNT_TYPE');
}

export function isZeroAmountQuote(quote: CouponQuote): boolean {
  return quote.finalAmountCents === 0;
}
