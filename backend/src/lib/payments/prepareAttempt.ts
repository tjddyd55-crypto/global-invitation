import { parseCheckoutMethod, parsePaymentCountry } from './checkoutMethod';
import { CouponError } from '../coupons/errors';
import { validateCouponForInvitation } from '../coupons/service';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';
import { getSystemRuntimeSettings } from '../ops/systemConfig';
import { resolveChargedAmountWithCoupon } from './couponBridge';
import { cancelIncompatiblePendingPayments, expireStalePendingPayments } from './pendingLifecycle';
import { findPaidPayment } from './paymentLookup';
import { resolvePrepareProvider } from './prepareProvider';
import { createOrReuseAttempt } from './prepareRecord';
import type { PrepareInput } from './prepareTypes';
import type { PreparePaymentResult } from './types';

export async function preparePaymentAttempt(input: PrepareInput): Promise<PreparePaymentResult> {
  const method = parseCheckoutMethod(input.checkoutMethod);
  if (!method) return { ok: false, code: 'INVALID_CHECKOUT_METHOD', message: 'Invalid checkout method' };
  if (method === 'OVERSEAS_EASY_PAY' && !parsePaymentCountry(input.country)) {
    return { ok: false, code: 'COUNTRY_REQUIRED', message: 'A payment country other than KR is required' };
  }
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
  const ready = await resolvePrepareProvider(isZero, chargedAmountCents, input);
  if (!ready.ok) return ready;
  await expireStalePendingPayments(input.invitationId);
  await cancelIncompatiblePendingPayments({
    invitationId: input.invitationId,
    snapshot,
    chargedAmountCents,
    checkout: { checkoutMethod: input.checkoutMethod, country: input.country, chargeAmount: ready.chargeAmount, usdKrwRate: ready.usdKrwRate },
  });
  return createOrReuseAttempt({
    input,
    pricing,
    chargedAmountCents,
    snapshot,
    ...ready,
    settlement: isZero ? 'zero_coupon' : 'provider',
  });
}
