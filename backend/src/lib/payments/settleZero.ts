import { InvitationPaymentStatus } from '@prisma/client';
import prisma from '../prisma';
import { CouponError, COUPON_ERROR_CODES } from '../coupons/errors';
import { findReservedUsageForPayment } from '../coupons/service';
import { findPaidPayment } from './paymentLookup';
import { markPaymentStatus } from './service';

export async function settleZeroCouponPayment(input: {
  invitationId: string;
  paymentId: string;
}): Promise<
  | { ok: true; paymentId: string; alreadyPaid: boolean }
  | { ok: false; code: string; message: string }
> {
  const existingPaid = await findPaidPayment(input.invitationId);
  if (existingPaid) {
    return { ok: true, paymentId: existingPaid.id, alreadyPaid: true };
  }

  const payment = await prisma.invitationPayment.findFirst({
    where: { id: input.paymentId, invitationId: input.invitationId },
  });
  if (!payment) {
    return { ok: false, code: 'PAYMENT_NOT_FOUND', message: '결제 시도를 찾을 수 없습니다.' };
  }
  if (payment.status === InvitationPaymentStatus.PAID) {
    return { ok: true, paymentId: payment.id, alreadyPaid: true };
  }
  if (payment.status !== InvitationPaymentStatus.PENDING) {
    return { ok: false, code: 'ATTEMPT_NOT_PENDING', message: '결제 시도가 대기 상태가 아닙니다.' };
  }
  if (payment.chargedAmount !== 0 || payment.provider !== 'coupon') {
    return { ok: false, code: 'COUPON_INVALID', message: '0원 정산 대상이 아닙니다.' };
  }

  const usage = await findReservedUsageForPayment(payment.id);
  if (!usage || usage.finalAmountCents !== 0) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_RESERVE_FAILED);
  }

  const marked = await markPaymentStatus({
    paymentId: payment.id,
    provider: 'coupon',
    status: InvitationPaymentStatus.PAID,
    currency: payment.currency,
    amountCents: 0,
    skipAmountCheck: false,
    rawProviderStatus: JSON.stringify({
      phase: 'zero_coupon_settled',
      couponCode: payment.couponCode,
    }),
  });

  if (!marked.ok || !marked.payment) {
    return { ok: false, code: marked.reason || 'CONFIRM_FAILED', message: '0원 정산에 실패했습니다.' };
  }
  return { ok: true, paymentId: marked.payment.id, alreadyPaid: false };
}
