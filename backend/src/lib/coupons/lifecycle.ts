import {
  InvitationCouponUsageStatus,
  type InvitationCoupon,
  type InvitationCouponUsage,
  type Prisma,
} from '@prisma/client';
import { PENDING_REUSE_WINDOW_MS } from '../payments/constants';
import { computeCouponQuote } from './calc';
import { CouponError, COUPON_ERROR_CODES } from './errors';
import { assertCouponLimits, assertCouponWindow, assertCouponCurrency } from './eligibility';
import { countActiveCouponUsages, countActiveCouponUsagesForUser } from './counts';

type Tx = Prisma.TransactionClient;

export function reservationExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + PENDING_REUSE_WINDOW_MS);
}

export async function releaseExpiredReservations(tx: Tx, now: Date = new Date()): Promise<number> {
  const expired = await tx.invitationCouponUsage.updateMany({
    where: {
      status: InvitationCouponUsageStatus.RESERVED,
      expiresAt: { lte: now },
    },
    data: {
      status: InvitationCouponUsageStatus.RELEASED,
      releasedAt: now,
    },
  });
  return expired.count;
}

export async function lockCouponRow(tx: Tx, couponId: string): Promise<InvitationCoupon> {
  await tx.$executeRaw`SELECT id FROM invitation_coupons WHERE id = ${couponId}::uuid FOR UPDATE`;
  const coupon = await tx.invitationCoupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new CouponError(COUPON_ERROR_CODES.COUPON_NOT_FOUND, 404);
  return coupon;
}

export async function assertReservable(
  tx: Tx,
  coupon: InvitationCoupon,
  userId: string | null,
  pricingCurrency: string,
  now: Date
): Promise<void> {
  assertCouponWindow(coupon, now);
  assertCouponCurrency(coupon.currency, pricingCurrency);
  const counts = {
    totalActive: await countActiveCouponUsages(tx, coupon.id),
    userActive: await countActiveCouponUsagesForUser(tx, coupon.id, userId),
  };
  assertCouponLimits(coupon, counts);
}

export function buildUsageSnapshot(coupon: InvitationCoupon, baseAmountCents: number) {
  const quote = computeCouponQuote({
    baseAmountCents,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });
  return {
    codeSnapshot: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    baseAmountCents: quote.baseAmountCents,
    discountAmountCents: quote.discountAmountCents,
    finalAmountCents: quote.finalAmountCents,
  };
}

export async function insertReservation(
  tx: Tx,
  input: {
    coupon: InvitationCoupon;
    userId: string | null;
    invitationId: string;
    paymentId: string;
    baseAmountCents: number;
    now: Date;
  }
): Promise<InvitationCouponUsage> {
  const snapshot = buildUsageSnapshot(input.coupon, input.baseAmountCents);
  return tx.invitationCouponUsage.create({
    data: {
      couponId: input.coupon.id,
      userId: input.userId,
      invitationId: input.invitationId,
      paymentId: input.paymentId,
      status: InvitationCouponUsageStatus.RESERVED,
      reservedAt: input.now,
      expiresAt: reservationExpiresAt(input.now),
      ...snapshot,
    },
  });
}

export async function redeemReservationForPayment(
  tx: Tx,
  paymentId: string,
  now: Date = new Date()
): Promise<InvitationCouponUsage | null> {
  const usage = await tx.invitationCouponUsage.findFirst({
    where: { paymentId, status: InvitationCouponUsageStatus.RESERVED },
  });
  if (!usage) return null;
  return tx.invitationCouponUsage.update({
    where: { id: usage.id },
    data: {
      status: InvitationCouponUsageStatus.REDEEMED,
      redeemedAt: now,
    },
  });
}

export async function releaseReservationForPayment(
  tx: Tx,
  paymentId: string,
  now: Date = new Date()
): Promise<InvitationCouponUsage | null> {
  const usage = await tx.invitationCouponUsage.findFirst({
    where: { paymentId, status: InvitationCouponUsageStatus.RESERVED },
  });
  if (!usage) return null;
  return tx.invitationCouponUsage.update({
    where: { id: usage.id },
    data: {
      status: InvitationCouponUsageStatus.RELEASED,
      releasedAt: now,
    },
  });
}

export async function releaseReservationById(
  tx: Tx,
  usageId: string,
  now: Date = new Date()
): Promise<void> {
  const usage = await tx.invitationCouponUsage.findUnique({ where: { id: usageId } });
  if (!usage || usage.status !== InvitationCouponUsageStatus.RESERVED) return;
  await tx.invitationCouponUsage.update({
    where: { id: usageId },
    data: { status: InvitationCouponUsageStatus.RELEASED, releasedAt: now },
  });
}
