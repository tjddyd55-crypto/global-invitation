import type { InvitationCouponDiscountType } from '@prisma/client';
import { CouponError } from '../coupons/errors';
import { quoteCouponCode, type ReserveCouponResult } from '../coupons/service';
import {
  assertReservable,
  insertReservation,
  lockCouponRow,
  releaseExpiredReservations,
  releaseReservationForPayment,
} from '../coupons/lifecycle';
import type { Prisma } from '@prisma/client';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';

export type PaymentCouponSnapshot = {
  couponId: string;
  couponCode: string;
  couponDiscountType: InvitationCouponDiscountType;
  couponDiscountValue: number;
  baseAmountCents: number;
  discountAmountCents: number;
  chargedAmountCents: number;
};

export type ResolvedCharge = {
  chargedAmountCents: number;
  snapshot: PaymentCouponSnapshot | null;
  coupon: ReserveCouponResult | null;
};

export async function resolveChargedAmountWithCoupon(couponCode?: string | null): Promise<ResolvedCharge> {
  const pricing = await getInvitationPricingSnapshot();
  if (!couponCode) {
    return { chargedAmountCents: pricing.chargedAmountCents, snapshot: null, coupon: null };
  }

  const quoted = await quoteCouponCode(couponCode);
  return {
    chargedAmountCents: quoted.quote.finalAmountCents,
    snapshot: {
      couponId: quoted.coupon.id,
      couponCode: quoted.coupon.code,
      couponDiscountType: quoted.coupon.discountType,
      couponDiscountValue: quoted.coupon.discountValue,
      baseAmountCents: quoted.quote.baseAmountCents,
      discountAmountCents: quoted.quote.discountAmountCents,
      chargedAmountCents: quoted.quote.finalAmountCents,
    },
    coupon: {
      couponId: quoted.coupon.id,
      usageId: '',
      code: quoted.coupon.code,
      currency: quoted.pricingCurrency,
      listPriceCents: quoted.listPriceCents,
      salePriceCents: quoted.salePriceCents,
      baseAmountCents: quoted.quote.baseAmountCents,
      discountAmountCents: quoted.quote.discountAmountCents,
      finalAmountCents: quoted.quote.finalAmountCents,
    },
  };
}

export function paymentSnapshotFields(snapshot: PaymentCouponSnapshot | null) {
  if (!snapshot) {
    return {
      couponId: null,
      couponCode: null,
      couponDiscountType: null,
      couponDiscountValue: null,
      baseAmountCents: null,
      discountAmountCents: null,
    };
  }
  return {
    couponId: snapshot.couponId,
    couponCode: snapshot.couponCode,
    couponDiscountType: snapshot.couponDiscountType,
    couponDiscountValue: snapshot.couponDiscountValue,
    baseAmountCents: snapshot.baseAmountCents,
    discountAmountCents: snapshot.discountAmountCents,
  };
}

export function sameCouponSnapshot(
  payment: { couponCode?: string | null; chargedAmount: number },
  snapshot: PaymentCouponSnapshot | null,
  chargedAmountCents: number
): boolean {
  const paymentCode = payment.couponCode || null;
  const nextCode = snapshot?.couponCode || null;
  return paymentCode === nextCode && payment.chargedAmount === chargedAmountCents;
}

export async function reserveOnPaymentTx(
  tx: Prisma.TransactionClient,
  input: {
    snapshot: PaymentCouponSnapshot;
    invitationId: string;
    paymentId: string;
    userId: string | null;
  }
): Promise<void> {
  await releaseExpiredReservations(tx);
  await releaseReservationForPayment(tx, input.paymentId);
  const locked = await lockCouponRow(tx, input.snapshot.couponId);
  const pricing = await getInvitationPricingSnapshot();
  await assertReservable(tx, locked, input.userId, pricing.currency, new Date());
  await insertReservation(tx, {
    coupon: locked,
    userId: input.userId,
    invitationId: input.invitationId,
    paymentId: input.paymentId,
    baseAmountCents: input.snapshot.baseAmountCents,
    now: new Date(),
  });
}

export function mapCouponPrepareError(error: unknown): {
  code: 'PREPARE_FAILED';
  message: string;
} | null {
  if (error instanceof CouponError) {
    return { code: 'PREPARE_FAILED', message: error.message };
  }
  return null;
}
