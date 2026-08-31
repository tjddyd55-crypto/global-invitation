import {
  InvitationPaymentStatus,
  type InvitationPayment,
  type Prisma,
} from '@prisma/client';
import prisma from '../prisma';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';
import { getSystemRuntimeSettings } from '../ops/systemConfig';
import {
  assertTossKeySafety,
  buildOrderId,
  getFrontendBaseUrl,
  getPaymentOrderName,
  mapTossPaymentStatus,
  resolvePaymentProvider,
  resolveTossChargeAmount,
  resolveTossRuntimeKeys,
} from './provider';
import { confirmTossPayment, getTossPaymentByKey } from './tossClient';
import type { ConfirmPaymentInput, PreparePaymentResult } from './types';

export async function findPaidPayment(invitationId: string): Promise<InvitationPayment | null> {
  return prisma.invitationPayment.findFirst({
    where: {
      invitationId,
      status: InvitationPaymentStatus.PAID,
    },
    orderBy: { paidAt: 'desc' },
  });
}

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
  };
}

function parseProviderMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function getExpectedProviderAmount(payment: InvitationPayment): number | null {
  const meta = parseProviderMeta(payment.rawProviderStatus);
  if (typeof meta.tossAmount === 'number') return meta.tossAmount;
  if (payment.provider === 'mock') return payment.chargedAmount;
  return null;
}

export function getExpectedProviderCurrency(payment: InvitationPayment): string {
  const meta = parseProviderMeta(payment.rawProviderStatus);
  if (typeof meta.tossCurrency === 'string') return meta.tossCurrency.toUpperCase();
  return payment.currency.toUpperCase();
}

const PENDING_REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

function buildCheckoutUrls(invitationId: string): { successUrl: string; failUrl: string } {
  const frontend = getFrontendBaseUrl();
  return {
    successUrl: `${frontend}/invitations/${invitationId}/payment/success`,
    failUrl: `${frontend}/invitations/${invitationId}/payment/fail`,
  };
}

export async function preparePaymentAttempt(input: {
  invitationId: string;
  userId?: string | null;
  /** Product Mode locale for Toss orderName (ko-KR / en-US). */
  locale?: string | null;
}): Promise<PreparePaymentResult> {
  const existingPaid = await findPaidPayment(input.invitationId);
  if (existingPaid) {
    return { ok: true, alreadyPaid: true, paymentId: existingPaid.id };
  }

  const system = await getSystemRuntimeSettings();
  if (!system.paymentsEnabled) {
    return {
      ok: false,
      code: 'PAYMENTS_DISABLED',
      message: 'Payments are temporarily disabled by system settings.',
    };
  }

  const pricing = await getInvitationPricingSnapshot();
  const provider = resolvePaymentProvider();
  const charge = resolveTossChargeAmount(provider, pricing.chargedAmountCents);
  if (!charge.ok) {
    return { ok: false, code: charge.code, message: charge.message };
  }

  let clientKey: string | null = null;
  let variantKey: string | null = null;
  if (provider === 'toss_payments') {
    const keys = await resolveTossRuntimeKeys();
    if (!keys.ok) {
      return {
        ok: false,
        code: keys.code === 'LIVE_PAYMENT_BLOCKED_IN_DEVELOPMENT'
          ? keys.code
          : 'FOREIGN_MID_NOT_CONFIGURED',
        message: keys.message,
      };
    }
    clientKey = keys.clientKey;
    variantKey = keys.variantKey;
    try {
      assertTossKeySafety(keys.clientKey, keys.secretKey);
    } catch (error) {
      return {
        ok: false,
        code: 'FOREIGN_MID_NOT_CONFIGURED',
        message: error instanceof Error ? error.message : 'Toss USD MID key validation failed',
      };
    }
  }

  const { successUrl, failUrl } = buildCheckoutUrls(input.invitationId);
  const orderName = getPaymentOrderName(input.locale);
  const paymentChannel = charge.channel;

  // Reuse a recent PENDING attempt to avoid infinite orders on double-click / multi-tab.
  const reusable = await prisma.invitationPayment.findFirst({
    where: {
      invitationId: input.invitationId,
      provider,
      status: InvitationPaymentStatus.PENDING,
      providerOrderId: { not: null },
      createdAt: { gte: new Date(Date.now() - PENDING_REUSE_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (reusable?.providerOrderId) {
    const expectedAmount = getExpectedProviderAmount(reusable);
    const expectedCurrency = getExpectedProviderCurrency(reusable);
    const amountMatches =
      expectedAmount === charge.amount.value && expectedCurrency === charge.amount.currency;

    if (amountMatches) {
      console.info('[payments] prepare reused pending', {
        invitationId: input.invitationId,
        paymentAttemptId: reusable.id,
        orderId: reusable.providerOrderId,
        provider,
        paymentChannel,
        userId: input.userId || null,
      });

      return {
        ok: true,
        alreadyPaid: false,
        paymentId: reusable.id,
        orderId: reusable.providerOrderId,
        provider,
        paymentChannel,
        orderName,
        domainCurrency: pricing.currency,
        productAmountMinor: pricing.chargedAmountCents,
        domainChargedAmountCents: pricing.chargedAmountCents,
        amount: charge.amount,
        successUrl,
        failUrl,
        clientKey,
        variantKey,
      };
    }
  }

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

  const orderId = buildOrderId(attempt.id);

  const meta = {
    phase: 'prepared',
    paymentChannel,
    tossAmount: charge.amount.value,
    tossCurrency: charge.amount.currency,
    productAmountMinor: pricing.chargedAmountCents,
    productCurrency: pricing.currency,
    pricingConfigId: pricing.pricingConfigId ?? null,
    pricingSource: pricing.source,
  };

  await prisma.invitationPayment.update({
    where: { id: attempt.id },
    data: {
      providerOrderId: orderId,
      providerCheckoutId: orderId,
      rawProviderStatus: JSON.stringify(meta),
    },
  });

  console.info('[payments] prepare created', {
    invitationId: input.invitationId,
    paymentAttemptId: attempt.id,
    orderId,
    provider,
    paymentChannel,
    userId: input.userId || null,
  });

  return {
    ok: true,
    alreadyPaid: false,
    paymentId: attempt.id,
    orderId,
    provider,
    paymentChannel,
    orderName,
    domainCurrency: pricing.currency,
    productAmountMinor: pricing.chargedAmountCents,
    domainChargedAmountCents: pricing.chargedAmountCents,
    amount: charge.amount,
    successUrl,
    failUrl,
    clientKey,
    variantKey,
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
