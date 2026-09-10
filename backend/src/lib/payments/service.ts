import {
  InvitationPaymentStatus,
  type InvitationPayment,
  type Prisma,
} from '@prisma/client';
import prisma from '../prisma';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';
import { mapTossPaymentStatus } from './provider';
import { confirmTossPayment, getTossPaymentByKey } from './tossClient';
import type { ConfirmPaymentInput } from './types';
import {
  findPaidPayment,
  getExpectedProviderAmount,
  getExpectedProviderCurrency,
  parseProviderMeta,
} from './paymentLookup';
import { redeemReservationForPayment, releaseReservationForPayment } from '../coupons/lifecycle';

export { findPaidPayment, getExpectedProviderAmount, getExpectedProviderCurrency };
export { preparePaymentAttempt } from './prepareAttempt';

/** Publish/public entitlement: valid PAID payment row only. */
export async function hasPaidEntitlement(invitationId: string): Promise<boolean> {
  return Boolean(await findPaidPayment(invitationId));
}

export async function getPaymentSummaryForInvitation(invitationId: string) {
  const pricing = await getInvitationPricingSnapshot();
  const paid = await findPaidPayment(invitationId);
  const latest = await prisma.invitationPayment.findFirst({
    where: { invitationId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    currency: pricing.currency,
    listPriceCents: pricing.listPriceCents,
    salePriceCents: pricing.chargedAmountCents,
    discountCents: pricing.listPriceCents - pricing.chargedAmountCents,
    promotionKey: pricing.promotionCode,
    isPaid: Boolean(paid),
    paidAt: paid?.paidAt?.toISOString() ?? null,
    latestStatus: latest?.status ?? null,
    latestPaymentId: latest?.id ?? null,
    provider: latest?.provider ?? null,
    couponCode: latest?.couponCode ?? null,
    discountAmountCents: latest?.discountAmountCents ?? null,
    chargedAmountCents: latest?.chargedAmount ?? null,
  };
}

export async function markPaymentStatus(input: {
  paymentId?: string;
  provider?: string;
  providerCheckoutId?: string | null;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  status: InvitationPaymentStatus;
  currency?: string | null;
  amountCents?: number | null;
  rawProviderStatus?: string | null;
  skipAmountCheck?: boolean;
}): Promise<{ ok: boolean; reason?: string; payment?: InvitationPayment }> {
  let payment: InvitationPayment | null = null;

  if (input.paymentId) {
    payment = await prisma.invitationPayment.findUnique({ where: { id: input.paymentId } });
  } else if (input.providerOrderId) {
    payment = await prisma.invitationPayment.findFirst({
      where: { providerOrderId: input.providerOrderId },
    });
  } else if (input.providerCheckoutId) {
    payment = await prisma.invitationPayment.findFirst({
      where: {
        provider: input.provider,
        providerCheckoutId: input.providerCheckoutId,
      },
    });
  } else if (input.providerPaymentId) {
    payment = await prisma.invitationPayment.findFirst({
      where: { providerPaymentId: input.providerPaymentId },
    });
  }

  if (!payment) {
    return { ok: false, reason: 'PAYMENT_NOT_FOUND' };
  }

  if (payment.status === InvitationPaymentStatus.PAID && input.status === InvitationPaymentStatus.PAID) {
    return { ok: true, payment };
  }

  if (input.status === InvitationPaymentStatus.PAID) {
    if (!input.skipAmountCheck) {
      const expectedAmount = getExpectedProviderAmount(payment);
      const expectedCurrency = getExpectedProviderCurrency(payment);
      if (input.currency && input.currency.toUpperCase() !== expectedCurrency) {
        console.warn('[payments] currency mismatch', {
          paymentId: payment.id,
          expected: expectedCurrency,
          actual: input.currency,
        });
        return { ok: false, reason: 'CURRENCY_MISMATCH' };
      }
      if (typeof input.amountCents === 'number' && expectedAmount !== null && input.amountCents !== expectedAmount) {
        console.warn('[payments] amount mismatch', {
          paymentId: payment.id,
          expected: expectedAmount,
          actual: input.amountCents,
        });
        return { ok: false, reason: 'AMOUNT_MISMATCH' };
      }
    }

    const paidAt = new Date();
    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingPaid = await tx.invitationPayment.findFirst({
        where: {
          invitationId: payment!.invitationId,
          status: InvitationPaymentStatus.PAID,
          NOT: { id: payment!.id },
        },
      });
      if (existingPaid) {
        return existingPaid;
      }

      const next = await tx.invitationPayment.update({
        where: { id: payment!.id },
        data: {
          status: InvitationPaymentStatus.PAID,
          paidAt,
          providerPaymentId: input.providerPaymentId || payment!.providerPaymentId,
          providerOrderId: input.providerOrderId || payment!.providerOrderId,
          providerCheckoutId: input.providerCheckoutId || payment!.providerCheckoutId,
          rawProviderStatus: input.rawProviderStatus || payment!.rawProviderStatus,
        },
      });

      await tx.invitation.update({
        where: { id: payment!.invitationId },
        data: {
          isPaid: true,
          canShare: true,
          paidAt,
        },
      });

      await redeemReservationForPayment(tx, next.id, paidAt);

      return next;
    });

    console.info('[payments] status transition', {
      paymentId: updated.id,
      invitationId: updated.invitationId,
      from: payment.status,
      to: InvitationPaymentStatus.PAID,
    });

    return { ok: true, payment: updated };
  }

  const now = new Date();
  const data: Prisma.InvitationPaymentUpdateInput = {
    status: input.status,
    rawProviderStatus: input.rawProviderStatus || input.status.toLowerCase(),
  };
  if (input.status === InvitationPaymentStatus.FAILED) data.failedAt = now;
  if (input.status === InvitationPaymentStatus.CANCELED) data.canceledAt = now;
  if (input.status === InvitationPaymentStatus.REFUNDED) data.refundedAt = now;
  if (input.providerPaymentId) data.providerPaymentId = input.providerPaymentId;

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const next = await tx.invitationPayment.update({
      where: { id: payment.id },
      data,
    });
    if (
      input.status === InvitationPaymentStatus.FAILED ||
      input.status === InvitationPaymentStatus.CANCELED
    ) {
      await releaseReservationForPayment(tx, next.id, now);
    }
    return next;
  });

  console.info('[payments] status transition', {
    paymentId: updated.id,
    invitationId: updated.invitationId,
    from: payment.status,
    to: input.status,
  });

  return { ok: true, payment: updated };
}

export async function confirmPaymentAttempt(
  input: ConfirmPaymentInput
): Promise<
  | { ok: true; payment: InvitationPayment; alreadyPaid: boolean }
  | { ok: false; code: string; message: string }
> {
  const payment = await prisma.invitationPayment.findFirst({
    where: {
      invitationId: input.invitationId,
      providerOrderId: input.orderId,
    },
  });

  if (!payment) {
    return { ok: false, code: 'PAYMENT_NOT_FOUND', message: 'Payment attempt not found for orderId' };
  }

  if (payment.status === InvitationPaymentStatus.PAID) {
    return { ok: true, payment, alreadyPaid: true };
  }

  if (payment.status !== InvitationPaymentStatus.PENDING) {
    return { ok: false, code: 'ATTEMPT_NOT_PENDING', message: `Attempt status is ${payment.status}` };
  }

  const expectedAmount = getExpectedProviderAmount(payment);
  if (expectedAmount === null || input.amount !== expectedAmount) {
    return { ok: false, code: 'AMOUNT_MISMATCH', message: 'Amount does not match prepared attempt' };
  }

  if (payment.provider === 'mock') {
    const marked = await markPaymentStatus({
      paymentId: payment.id,
      provider: 'mock',
      providerOrderId: input.orderId,
      providerPaymentId: input.paymentKey,
      status: InvitationPaymentStatus.PAID,
      currency: getExpectedProviderCurrency(payment),
      amountCents: expectedAmount,
      rawProviderStatus: JSON.stringify({
        ...parseProviderMeta(payment.rawProviderStatus),
        phase: 'mock_confirmed',
        paymentKey: input.paymentKey,
      }),
    });
    if (!marked.ok || !marked.payment) {
      return { ok: false, code: marked.reason || 'CONFIRM_FAILED', message: 'Failed to mark mock payment paid' };
    }
    return { ok: true, payment: marked.payment, alreadyPaid: false };
  }

  if (payment.provider !== 'toss_payments') {
    return { ok: false, code: 'INVALID_PROVIDER', message: `Unsupported provider ${payment.provider}` };
  }

  const confirmed = await confirmTossPayment({
    paymentKey: input.paymentKey,
    orderId: input.orderId,
    amount: expectedAmount,
    idempotencyKey: payment.id,
  });

  if (!confirmed.ok) {
    await markPaymentStatus({
      paymentId: payment.id,
      provider: 'toss_payments',
      status: InvitationPaymentStatus.FAILED,
      skipAmountCheck: true,
      rawProviderStatus: JSON.stringify({
        ...parseProviderMeta(payment.rawProviderStatus),
        phase: 'confirm_failed',
        code: confirmed.code,
      }),
    });
    return { ok: false, code: confirmed.code, message: confirmed.message };
  }

  const toss = confirmed.payment;
  if (toss.orderId !== input.orderId) {
    return { ok: false, code: 'ORDER_ID_MISMATCH', message: 'Toss orderId mismatch' };
  }
  if (toss.paymentKey !== input.paymentKey) {
    return { ok: false, code: 'PAYMENT_KEY_MISMATCH', message: 'Toss paymentKey mismatch' };
  }
  if (toss.totalAmount !== expectedAmount) {
    return { ok: false, code: 'AMOUNT_MISMATCH', message: 'Toss totalAmount mismatch' };
  }
  const expectedCurrency = getExpectedProviderCurrency(payment);
  if ((toss.currency || '').toUpperCase() !== expectedCurrency) {
    return { ok: false, code: 'CURRENCY_MISMATCH', message: 'Toss currency mismatch' };
  }
  if ((toss.status || '').toUpperCase() !== 'DONE') {
    return { ok: false, code: 'INVALID_STATUS', message: `Toss status is ${toss.status}` };
  }

  const marked = await markPaymentStatus({
    paymentId: payment.id,
    provider: 'toss_payments',
    providerOrderId: toss.orderId,
    providerPaymentId: toss.paymentKey,
    status: InvitationPaymentStatus.PAID,
    currency: toss.currency,
    amountCents: toss.totalAmount,
    rawProviderStatus: JSON.stringify({
      ...parseProviderMeta(payment.rawProviderStatus),
      phase: 'confirmed',
      tossStatus: toss.status,
      lastTransactionKey: toss.lastTransactionKey || null,
      approvedAt: toss.approvedAt || null,
    }),
  });

  if (!marked.ok || !marked.payment) {
    return { ok: false, code: marked.reason || 'CONFIRM_FAILED', message: 'Failed to persist PAID' };
  }

  return { ok: true, payment: marked.payment, alreadyPaid: false };
}

export async function reconcileTossPaymentByKey(paymentKey: string): Promise<{
  ok: boolean;
  reason?: string;
  payment?: InvitationPayment;
}> {
  const queried = await getTossPaymentByKey(paymentKey);
  if (!queried.ok) {
    return { ok: false, reason: queried.code };
  }

  const toss = queried.payment;
  const mapped = mapTossPaymentStatus(toss.status);
  if (!mapped || mapped === 'PENDING') {
    return { ok: true };
  }

  return markPaymentStatus({
    provider: 'toss_payments',
    providerOrderId: toss.orderId,
    providerPaymentId: toss.paymentKey,
    status: InvitationPaymentStatus[mapped],
    currency: toss.currency,
    amountCents: toss.totalAmount,
    rawProviderStatus: JSON.stringify({
      phase: 'webhook_reconcile',
      tossStatus: toss.status,
      lastTransactionKey: toss.lastTransactionKey || null,
    }),
    skipAmountCheck: mapped !== 'PAID',
  });
}

export async function recordWebhookEvent(input: {
  provider: string;
  providerEventId: string;
  eventType?: string;
}): Promise<'new' | 'duplicate'> {
  try {
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: input.provider,
        providerEventId: input.providerEventId,
        eventType: input.eventType || null,
      },
    });
    return 'new';
  } catch {
    return 'duplicate';
  }
}
