import {
  InvitationCouponUsageStatus,
  type InvitationCoupon,
  type Prisma,
} from '@prisma/client';
import prisma from '../prisma';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';
import { parseCouponCode } from './codes';
import { CouponError, COUPON_ERROR_CODES } from './errors';
import { countActiveCouponUsages, countActiveCouponUsagesForUser } from './counts';
import {
  assertReservable,
  buildUsageSnapshot,
  insertReservation,
  lockCouponRow,
  releaseExpiredReservations,
  releaseReservationById,
  releaseReservationForPayment,
} from './lifecycle';
import { quoteCouponAgainstCurrentPricing, type PublicCouponQuote } from './quote';

export type ValidateCouponResult = PublicCouponQuote;

async function findCouponByCode(code: string): Promise<InvitationCoupon | null> {
  return prisma.invitationCoupon.findUnique({ where: { code } });
}

export async function validateCouponForInvitation(input: {
  code: unknown;
  invitationId: string;
  userId: string | null;
  alreadyPaid: boolean;
}): Promise<ValidateCouponResult> {
  if (input.alreadyPaid) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_ALREADY_PAID);
  }

  const code = parseCouponCode(input.code);
  if (!code) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);

  await prisma.$transaction((tx) => releaseExpiredReservations(tx));

  const coupon = await findCouponByCode(code);
  if (!coupon) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);

  const counts = {
    totalActive: await countActiveCouponUsages(prisma, coupon.id),
    userActive: await countActiveCouponUsagesForUser(prisma, coupon.id, input.userId),
  };
  return quoteCouponAgainstCurrentPricing(coupon, counts);
}

export type ReserveCouponResult = PublicCouponQuote & {
  couponId: string;
  usageId: string;
};

export async function reserveCouponForPayment(input: {
  code: unknown;
  invitationId: string;
  paymentId: string;
  userId: string | null;
  alreadyPaid: boolean;
}): Promise<ReserveCouponResult> {
  if (input.alreadyPaid) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_ALREADY_PAID);
  }
  const code = parseCouponCode(input.code);
  if (!code) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);

  return prisma.$transaction(async (tx) => {
    await releaseExpiredReservations(tx);
    const coupon = await tx.invitationCoupon.findUnique({ where: { code } });
    if (!coupon) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
    const locked = await lockCouponRow(tx, coupon.id);
    const pricing = await getInvitationPricingSnapshot();
    await assertReservable(tx, locked, input.userId, pricing.currency, new Date());
    const usage = await insertReservation(tx, {
      coupon: locked,
      userId: input.userId,
      invitationId: input.invitationId,
      paymentId: input.paymentId,
      baseAmountCents: pricing.chargedAmountCents,
      now: new Date(),
    });
    return {
      couponId: locked.id,
      usageId: usage.id,
      code: locked.code,
      currency: pricing.currency,
      listPriceCents: pricing.listPriceCents,
      salePriceCents: pricing.chargedAmountCents,
      baseAmountCents: usage.baseAmountCents,
      discountAmountCents: usage.discountAmountCents,
      finalAmountCents: usage.finalAmountCents,
    };
  });
}

export async function replaceReservationForPayment(input: {
  code: unknown;
  invitationId: string;
  paymentId: string;
  userId: string | null;
  alreadyPaid: boolean;
}): Promise<ReserveCouponResult> {
  return prisma.$transaction(async (tx) => {
    await releaseReservationForPayment(tx, input.paymentId);
    return reserveCouponForPaymentInsideTx(tx, input);
  });
}

async function reserveCouponForPaymentInsideTx(
  tx: Prisma.TransactionClient,
  input: {
    code: unknown;
    invitationId: string;
    paymentId: string;
    userId: string | null;
    alreadyPaid: boolean;
  }
): Promise<ReserveCouponResult> {
  if (input.alreadyPaid) throw new CouponError(COUPON_ERROR_CODES.COUPON_ALREADY_PAID);
  const code = parseCouponCode(input.code);
  if (!code) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
  await releaseExpiredReservations(tx);
  const coupon = await tx.invitationCoupon.findUnique({ where: { code } });
  if (!coupon) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
  const locked = await lockCouponRow(tx, coupon.id);
  const pricing = await getInvitationPricingSnapshot();
  await assertReservable(tx, locked, input.userId, pricing.currency, new Date());
  const usage = await insertReservation(tx, {
    coupon: locked,
    userId: input.userId,
    invitationId: input.invitationId,
    paymentId: input.paymentId,
    baseAmountCents: pricing.chargedAmountCents,
    now: new Date(),
  });
  return toReserveResult(locked, usage, pricing);
}

function toReserveResult(
  coupon: InvitationCoupon,
  usage: { id: string; baseAmountCents: number; discountAmountCents: number; finalAmountCents: number },
  pricing: { currency: string; listPriceCents: number; chargedAmountCents: number }
): ReserveCouponResult {
  return {
    couponId: coupon.id,
    usageId: usage.id,
    code: coupon.code,
    currency: pricing.currency,
    listPriceCents: pricing.listPriceCents,
    salePriceCents: pricing.chargedAmountCents,
    baseAmountCents: usage.baseAmountCents,
    discountAmountCents: usage.discountAmountCents,
    finalAmountCents: usage.finalAmountCents,
  };
}

export async function quoteCouponCode(code: unknown): Promise<{
  coupon: InvitationCoupon;
  quote: ReturnType<typeof buildUsageSnapshot>;
  pricingCurrency: string;
  listPriceCents: number;
  salePriceCents: number;
}> {
  const parsed = parseCouponCode(code);
  if (!parsed) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
  const coupon = await findCouponByCode(parsed);
  if (!coupon) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
  const pricing = await getInvitationPricingSnapshot();
  const quote = buildUsageSnapshot(coupon, pricing.chargedAmountCents);
  return {
    coupon,
    quote,
    pricingCurrency: pricing.currency,
    listPriceCents: pricing.listPriceCents,
    salePriceCents: pricing.chargedAmountCents,
  };
}

export async function findReservedUsageForPayment(paymentId: string) {
  return prisma.invitationCouponUsage.findFirst({
    where: { paymentId, status: InvitationCouponUsageStatus.RESERVED },
  });
}

export { releaseReservationById, releaseReservationForPayment };
