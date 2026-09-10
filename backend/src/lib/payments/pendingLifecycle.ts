import { InvitationPaymentStatus } from '@prisma/client';
import prisma from '../prisma';
import { releaseReservationForPayment } from '../coupons/lifecycle';
import { PENDING_REUSE_WINDOW_MS } from './constants';
import { sameCouponSnapshot, type PaymentCouponSnapshot } from './couponBridge';

async function cancelPendingPayment(paymentId: string, reason: string, now: Date): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.invitationPayment.update({
      where: { id: paymentId },
      data: {
        status: InvitationPaymentStatus.CANCELED,
        canceledAt: now,
        rawProviderStatus: reason,
      },
    });
    await releaseReservationForPayment(tx, paymentId, now);
  });
}

export async function expireStalePendingPayments(
  invitationId: string,
  now: Date = new Date()
): Promise<number> {
  const stale = await prisma.invitationPayment.findMany({
    where: {
      invitationId,
      status: InvitationPaymentStatus.PENDING,
      createdAt: { lt: new Date(now.getTime() - PENDING_REUSE_WINDOW_MS) },
    },
    select: { id: true },
  });
  for (const payment of stale) {
    await cancelPendingPayment(payment.id, 'expired_pending', now);
  }
  return stale.length;
}

export async function cancelIncompatiblePendingPayments(input: {
  invitationId: string;
  snapshot: PaymentCouponSnapshot | null;
  chargedAmountCents: number;
  now?: Date;
}): Promise<number> {
  const now = input.now ?? new Date();
  const pendings = await prisma.invitationPayment.findMany({
    where: {
      invitationId: input.invitationId,
      status: InvitationPaymentStatus.PENDING,
    },
  });
  let canceled = 0;
  for (const payment of pendings) {
    if (sameCouponSnapshot(payment, input.snapshot, input.chargedAmountCents)) continue;
    await cancelPendingPayment(payment.id, 'replaced_by_new_prepare', now);
    canceled += 1;
  }
  return canceled;
}
