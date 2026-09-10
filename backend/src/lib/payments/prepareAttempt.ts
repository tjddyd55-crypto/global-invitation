import { InvitationPaymentStatus } from '@prisma/client';
import prisma from '../prisma';
import { CouponError } from '../coupons/errors';
import { validateCouponForInvitation } from '../coupons/service';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';
import { getSystemRuntimeSettings } from '../ops/systemConfig';
import {
  assertTossKeySafety,
  buildOrderId,
  getPaymentOrderName,
  resolveTossChargeAmount,
  resolveTossRuntimeKeys,
  tryResolvePaymentProvider,
} from './provider';
import { PENDING_REUSE_WINDOW_MS } from './constants';
import {
  paymentSnapshotFields,
  reserveOnPaymentTx,
  resolveChargedAmountWithCoupon,
  sameCouponSnapshot,
  type PaymentCouponSnapshot,
} from './couponBridge';
import { cancelIncompatiblePendingPayments, expireStalePendingPayments } from './pendingLifecycle';
import { findPaidPayment, getExpectedProviderAmount, getExpectedProviderCurrency } from './paymentLookup';
import type { PaymentChannel, PaymentProviderName, PreparePaymentResult, TossChargeAmount } from './types';

function buildCheckoutUrls(invitationId: string): { successUrl: string; failUrl: string } {
  const frontend = (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  return {
    successUrl: `${frontend}/invitations/${invitationId}/payment/success`,
    failUrl: `${frontend}/invitations/${invitationId}/payment/fail`,
  };
}

type PrepareInput = {
  invitationId: string;
  userId?: string | null;
  locale?: string | null;
  couponCode?: string | null;
};

export async function preparePaymentAttempt(input: PrepareInput): Promise<PreparePaymentResult> {
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

  try {
    return await prepareChargedAttempt(input);
  } catch (error) {
    if (error instanceof CouponError) {
      return couponPrepareFailure(error);
    }
    throw error;
  }
}

function couponPrepareFailure(error: CouponError): Extract<PreparePaymentResult, { ok: false }> {
  const allowed = new Set([
    'COUPON_INVALID',
    'COUPON_INACTIVE',
    'COUPON_NOT_STARTED',
    'COUPON_EXPIRED',
    'COUPON_LIMIT_REACHED',
    'COUPON_USER_LIMIT_REACHED',
    'COUPON_ALREADY_PAID',
    'COUPON_RESERVE_FAILED',
  ]);
  const code = allowed.has(error.code) ? error.code : 'COUPON_INVALID';
  return { ok: false, code: code as Extract<PreparePaymentResult, { ok: false }>['code'], message: error.message };
}

async function prepareChargedAttempt(input: PrepareInput): Promise<PreparePaymentResult> {
  if (input.couponCode) {
    await validateCouponForInvitation({
      code: input.couponCode,
      invitationId: input.invitationId,
      userId: input.userId || null,
      alreadyPaid: false,
    });
  }

  const pricing = await getInvitationPricingSnapshot();
  const resolved = await resolveChargedAmountWithCoupon(input.couponCode);
  const chargedAmountCents = resolved.chargedAmountCents;
  const snapshot = resolved.snapshot;
  const isZero = chargedAmountCents === 0;
  if (isZero && !snapshot) {
    return { ok: false, code: 'COUPON_INVALID', message: '유효한 쿠폰 없이 0원 결제는 허용되지 않습니다.' };
  }

  const ready = await resolvePrepareProvider(isZero, chargedAmountCents);
  if (!ready.ok) return ready;

  await expireStalePendingPayments(input.invitationId);
  await cancelIncompatiblePendingPayments({
    invitationId: input.invitationId,
    snapshot,
    chargedAmountCents,
  });

  return createOrReuseAttempt({
    input,
    pricing,
    provider: ready.provider,
    chargedAmountCents,
    snapshot,
    chargeAmount: ready.chargeAmount,
    paymentChannel: ready.paymentChannel,
    clientKey: ready.clientKey,
    variantKey: ready.variantKey,
    settlement: isZero ? 'zero_coupon' : 'provider',
  });
}

async function resolvePrepareProvider(
  isZero: boolean,
  chargedAmountCents: number
): Promise<
  | {
      ok: true;
      provider: PaymentProviderName;
      chargeAmount: TossChargeAmount;
      paymentChannel: PaymentChannel;
      clientKey: string | null;
      variantKey: string | null;
    }
  | Extract<PreparePaymentResult, { ok: false }>
> {
  const providerResolved = tryResolvePaymentProvider();
  if (!isZero && !providerResolved.ok) {
    return { ok: false, code: providerResolved.code, message: providerResolved.message };
  }
  const provider = providerResolved.ok ? providerResolved.provider : 'coupon';
  const providerCharge = isZero
    ? { ok: true as const, amount: { currency: 'USD' as const, value: 0 }, channel: 'INTERNATIONAL_USD' as const }
    : resolveTossChargeAmount(provider, chargedAmountCents);
  if (!providerCharge.ok) {
    return { ok: false, code: providerCharge.code, message: providerCharge.message };
  }
  const keys = await loadProviderKeys(provider, isZero);
  if (!keys.ok) return keys;
  return {
    ok: true,
    provider,
    chargeAmount: providerCharge.amount,
    paymentChannel: providerCharge.channel,
    clientKey: keys.clientKey,
    variantKey: keys.variantKey,
  };
}

async function loadProviderKeys(
  provider: PaymentProviderName,
  isZero: boolean
): Promise<
  | { ok: true; clientKey: string | null; variantKey: string | null }
  | Extract<PreparePaymentResult, { ok: false }>
> {
  if (isZero || provider !== 'toss_payments') {
    return { ok: true, clientKey: null, variantKey: null };
  }
  const keys = await resolveTossRuntimeKeys();
  if (!keys.ok) {
    return {
      ok: false,
      code: keys.code === 'LIVE_PAYMENT_BLOCKED_IN_DEVELOPMENT' ? keys.code : 'FOREIGN_MID_NOT_CONFIGURED',
      message: keys.message,
    };
  }
  try {
    assertTossKeySafety(keys.clientKey, keys.secretKey);
  } catch (error) {
    return {
      ok: false,
      code: 'FOREIGN_MID_NOT_CONFIGURED',
      message: error instanceof Error ? error.message : 'Toss USD MID key validation failed',
    };
  }
  return { ok: true, clientKey: keys.clientKey, variantKey: keys.variantKey };
}

async function createOrReuseAttempt(args: {
  input: PrepareInput;
  pricing: Awaited<ReturnType<typeof getInvitationPricingSnapshot>>;
  provider: PaymentProviderName;
  chargedAmountCents: number;
  snapshot: PaymentCouponSnapshot | null;
  chargeAmount: TossChargeAmount;
  paymentChannel: PaymentChannel;
  clientKey: string | null;
  variantKey: string | null;
  settlement: 'provider' | 'zero_coupon';
}): Promise<PreparePaymentResult> {
  const { input, pricing, provider, chargedAmountCents, snapshot, settlement } = args;
  const { successUrl, failUrl } = buildCheckoutUrls(input.invitationId);
  const orderName = getPaymentOrderName(input.locale);
  const couponSummary = snapshot
    ? { code: snapshot.couponCode, discountAmountCents: snapshot.discountAmountCents, finalAmountCents: snapshot.chargedAmountCents }
    : null;

  const reused = await maybeReusePending(args, successUrl, failUrl, orderName, couponSummary);
  if (reused) return reused;

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.invitationPayment.create({
      data: {
        invitationId: input.invitationId,
        userId: input.userId || null,
        provider: settlement === 'zero_coupon' ? 'coupon' : provider,
        currency: pricing.currency,
        listPriceAmount: pricing.listPriceCents,
        chargedAmount: chargedAmountCents,
        promotionCode: pricing.promotionCode,
        status: InvitationPaymentStatus.PENDING,
        ...paymentSnapshotFields(snapshot),
      },
    });
    if (snapshot) {
      await reserveOnPaymentTx(tx, {
        snapshot,
        invitationId: input.invitationId,
        paymentId: created.id,
        userId: input.userId || null,
      });
    }
    return created;
  });

  const orderId = buildOrderId(attempt.id);
  const meta = {
    phase: 'prepared',
    paymentChannel: args.paymentChannel,
    tossAmount: args.chargeAmount.value,
    tossCurrency: args.chargeAmount.currency,
    productAmountMinor: chargedAmountCents,
    productCurrency: pricing.currency,
    pricingConfigId: pricing.pricingConfigId ?? null,
    pricingSource: pricing.source,
    settlement,
    couponCode: snapshot?.couponCode ?? null,
  };
  await prisma.invitationPayment.update({
    where: { id: attempt.id },
    data: {
      providerOrderId: orderId,
      providerCheckoutId: orderId,
      rawProviderStatus: JSON.stringify(meta),
    },
  });

  return {
    ok: true,
    alreadyPaid: false,
    paymentId: attempt.id,
    orderId,
    provider: settlement === 'zero_coupon' ? 'coupon' : provider,
    paymentChannel: args.paymentChannel,
    orderName,
    domainCurrency: pricing.currency,
    productAmountMinor: chargedAmountCents,
    domainChargedAmountCents: chargedAmountCents,
    amount: args.chargeAmount,
    successUrl,
    failUrl,
    clientKey: args.clientKey,
    variantKey: args.variantKey,
    settlement,
    coupon: couponSummary,
  };
}

async function maybeReusePending(
  args: Parameters<typeof createOrReuseAttempt>[0],
  successUrl: string,
  failUrl: string,
  orderName: string,
  couponSummary: { code: string; discountAmountCents: number; finalAmountCents: number } | null
): Promise<Extract<PreparePaymentResult, { alreadyPaid: false }> | null> {
  const { input, pricing, provider, chargedAmountCents, snapshot, settlement } = args;
  const reuseProvider = settlement === 'zero_coupon' ? 'coupon' : provider;
  const reusable = await prisma.invitationPayment.findFirst({
    where: {
      invitationId: input.invitationId,
      provider: reuseProvider,
      status: InvitationPaymentStatus.PENDING,
      providerOrderId: { not: null },
      createdAt: { gte: new Date(Date.now() - PENDING_REUSE_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!reusable?.providerOrderId) return null;
  if (!sameCouponSnapshot(reusable, snapshot, chargedAmountCents)) return null;

  const expectedAmount = getExpectedProviderAmount(reusable);
  const expectedCurrency = getExpectedProviderCurrency(reusable);
  const amountMatches =
    settlement === 'zero_coupon'
      ? reusable.chargedAmount === 0
      : expectedAmount === args.chargeAmount.value && expectedCurrency === args.chargeAmount.currency;
  if (!amountMatches) return null;

  return {
    ok: true,
    alreadyPaid: false,
    paymentId: reusable.id,
    orderId: reusable.providerOrderId,
    provider: reuseProvider,
    paymentChannel: args.paymentChannel,
    orderName,
    domainCurrency: pricing.currency,
    productAmountMinor: chargedAmountCents,
    domainChargedAmountCents: chargedAmountCents,
    amount: args.chargeAmount,
    successUrl,
    failUrl,
    clientKey: args.clientKey,
    variantKey: args.variantKey,
    settlement,
    coupon: couponSummary,
  };
}
