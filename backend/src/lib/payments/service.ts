import {
  InvitationPaymentStatus,
  type InvitationPayment,
  type Prisma,
} from '@prisma/client';
import prisma from '../prisma';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';
import {
  createProviderCheckout,
  getFrontendBaseUrl,
  resolvePaymentProvider,
  type PaymentProviderName,
} from './provider';

export async function findPaidPayment(invitationId: string): Promise<InvitationPayment | null> {
  return prisma.invitationPayment.findFirst({
    where: {
      invitationId,
      status: InvitationPaymentStatus.PAID,
    },
    orderBy: { paidAt: 'desc' },
  });
}

export async function hasPaidEntitlement(invitationId: string): Promise<boolean> {
  const paid = await findPaidPayment(invitationId);
  return Boolean(paid);
}

export async function syncInvitationPaidFlags(invitationId: string, paidAt: Date): Promise<void> {
  await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      isPaid: true,
      canShare: true,
      paidAt,
    },
  });
}

export async function getPaymentSummaryForInvitation(invitationId: string) {
  const pricing = getInvitationPricingSnapshot();
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
  };
}

type CheckoutCreateResult =
  | { ok: true; alreadyPaid: false; paymentId: string; checkoutUrl: string; provider: PaymentProviderName }
  | { ok: true; alreadyPaid: true; paymentId: string }
  | { ok: false; code: 'ALREADY_PAID' | 'CHECKOUT_FAILED'; message: string };

export async function createCheckoutAttempt(input: {
  invitationId: string;
  userId?: string | null;
}): Promise<CheckoutCreateResult> {
  const existingPaid = await findPaidPayment(input.invitationId);
  if (existingPaid) {
    return { ok: true, alreadyPaid: true, paymentId: existingPaid.id };
  }

  const provider = resolvePaymentProvider();
  const pricing = getInvitationPricingSnapshot();

  const attempt = await prisma.invitationPayment.create({
    data: {
      invitationId: input.invitationId,
      userId: input.userId || null,
      provider,
      currency: pricing.currency,
      listPriceAmount: pricing.listPriceCents,
      chargedAmount: pricing.chargedAmountCents,
      promotionCode: pricing.promotionCode,
      status: InvitationPaymentStatus.PENDING,
    },
  });

  const frontend = getFrontendBaseUrl();
  const successUrl =
    `${frontend}/invitations/${input.invitationId}/payment` +
    `?status=processing&paymentId=${encodeURIComponent(attempt.id)}`;
  const cancelUrl =
    `${frontend}/invitations/${input.invitationId}/payment` +
    `?status=canceled&paymentId=${encodeURIComponent(attempt.id)}`;

  try {
    const session = await createProviderCheckout({
      provider,
      invitationId: input.invitationId,
      paymentAttemptId: attempt.id,
      successUrl,
      cancelUrl,
    });

    await prisma.invitationPayment.update({
      where: { id: attempt.id },
      data: {
        providerCheckoutId: session.providerCheckoutId,
        rawProviderStatus: 'checkout_created',
      },
    });

    console.info('[payments] checkout created', {
      invitationId: input.invitationId,
      paymentAttemptId: attempt.id,
      provider,
      userId: input.userId || null,
    });

    return {
      ok: true,
      alreadyPaid: false,
      paymentId: attempt.id,
      checkoutUrl: session.checkoutUrl,
      provider,
    };
  } catch (error) {
    await prisma.invitationPayment.update({
      where: { id: attempt.id },
      data: {
        status: InvitationPaymentStatus.FAILED,
        failedAt: new Date(),
        rawProviderStatus: 'checkout_create_failed',
      },
    });
    console.error('[payments] checkout create failed', {
      invitationId: input.invitationId,
      paymentAttemptId: attempt.id,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return { ok: false, code: 'CHECKOUT_FAILED', message: 'Failed to create checkout' };
  }
}

export async function markPaymentStatus(input: {
  paymentId?: string;
  provider: string;
  providerCheckoutId?: string | null;
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
  } else if (input.providerCheckoutId) {
    payment = await prisma.invitationPayment.findFirst({
      where: {
        provider: input.provider,
        providerCheckoutId: input.providerCheckoutId,
      },
    });
  } else if (input.providerPaymentId) {
    payment = await prisma.invitationPayment.findFirst({
      where: {
        provider: input.provider,
        providerPaymentId: input.providerPaymentId,
      },
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
      if (input.currency && input.currency.toUpperCase() !== payment.currency.toUpperCase()) {
        console.warn('[payments] currency mismatch', {
          paymentId: payment.id,
          expected: payment.currency,
          actual: input.currency,
        });
        return { ok: false, reason: 'CURRENCY_MISMATCH' };
      }
      if (
        typeof input.amountCents === 'number' &&
        input.amountCents !== payment.chargedAmount
      ) {
        console.warn('[payments] amount mismatch', {
          paymentId: payment.id,
          expected: payment.chargedAmount,
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
          providerCheckoutId: input.providerCheckoutId || payment!.providerCheckoutId,
          rawProviderStatus: input.rawProviderStatus || 'paid',
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

  const updated = await prisma.invitationPayment.update({
    where: { id: payment.id },
    data,
  });

  console.info('[payments] status transition', {
    paymentId: updated.id,
    invitationId: updated.invitationId,
    from: payment.status,
    to: input.status,
  });

  return { ok: true, payment: updated };
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
