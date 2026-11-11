import { InvitationPaymentStatus } from '@prisma/client';
import prisma from '../prisma';
import { matchesCheckoutIdentity } from './checkoutIdentity';
import { parseCheckoutMethod, parsePaymentCountry } from './checkoutMethod';
import { buildOrderId, getPaymentOrderName } from './provider';
import { PENDING_REUSE_WINDOW_MS } from './constants';
import { paymentSnapshotFields, reserveOnPaymentTx, sameCouponSnapshot } from './couponBridge';
import type { PrepareAttemptArgs } from './prepareTypes';
import type { PreparePaymentResult } from './types';

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

export async function createOrReuseAttempt(args: PrepareAttemptArgs): Promise<PreparePaymentResult> {
  const { input, snapshot } = args;
  const { successUrl, failUrl } = buildCheckoutUrls(input.invitationId);
  const orderName = getPaymentOrderName(input.locale);
  const couponSummary = snapshot
    ? { code: snapshot.couponCode, discountAmountCents: snapshot.discountAmountCents, finalAmountCents: snapshot.chargedAmountCents }
    : null;

  const reused = await maybeReusePending(args, successUrl, failUrl, orderName, couponSummary);
  if (reused) return reused;

  const attempt = await createPendingRecord(args);
  await storePreparedMeta(args, attempt.id);
  return prepareResponse(args, attempt.id, successUrl, failUrl, orderName, couponSummary);
}

async function createPendingRecord(args: PrepareAttemptArgs) {
  const { input, pricing, provider, chargedAmountCents, snapshot, settlement } = args;
  return prisma.$transaction(async (tx) => {
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
}

async function storePreparedMeta(args: PrepareAttemptArgs, paymentId: string): Promise<void> {
  const { input, pricing, chargedAmountCents, snapshot, settlement } = args;
  const orderId = buildOrderId(paymentId);
  const meta = {
    phase: 'prepared',
    checkoutMethod: parseCheckoutMethod(input.checkoutMethod),
    country: parsePaymentCountry(input.country),
    usdKrwRate: args.usdKrwRate,
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
    where: { id: paymentId },
    data: {
      providerOrderId: orderId,
      providerCheckoutId: orderId,
      rawProviderStatus: JSON.stringify(meta),
    },
  });

}

type CouponSummary = { code: string; discountAmountCents: number; finalAmountCents: number } | null;
function prepareResponse(args: PrepareAttemptArgs, paymentId: string, successUrl: string, failUrl: string,
  orderName: string, couponSummary: CouponSummary): Extract<PreparePaymentResult, { alreadyPaid: false }> {
  const { input, pricing, provider, chargedAmountCents, settlement } = args;

  return {
    ok: true,
    alreadyPaid: false,
    paymentId,
    orderId: buildOrderId(paymentId),
    provider: settlement === 'zero_coupon' ? 'coupon' : provider,
    checkoutMethod: parseCheckoutMethod(input.checkoutMethod)!,
    country: parsePaymentCountry(input.country),
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
  args: PrepareAttemptArgs,
  successUrl: string,
  failUrl: string,
  orderName: string,
  couponSummary: { code: string; discountAmountCents: number; finalAmountCents: number } | null
): Promise<Extract<PreparePaymentResult, { alreadyPaid: false }> | null> {
  const { input, provider, chargedAmountCents, snapshot, settlement } = args;
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
  if (!matchesCheckoutIdentity(reusable, { ...args.input, chargeAmount: args.chargeAmount, usdKrwRate: args.usdKrwRate })) return null;
  if (!sameCouponSnapshot(reusable, snapshot, chargedAmountCents)) return null;

  return { ...prepareResponse(args, reusable.id, successUrl, failUrl, orderName, couponSummary), orderId: reusable.providerOrderId };
}
