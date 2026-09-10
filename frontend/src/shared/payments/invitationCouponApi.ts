import { buildApiUrl, buildRequestInit } from '@/src/shared/api';
import { buildAuthHeaders } from '@/src/lib/auth';

export type CouponQuoteResponse = {
  ok: true;
  currency: string;
  listPriceCents: number;
  salePriceCents: number;
  discountAmountCents: number;
  finalAmountCents: number;
};

export type CouponApiError = {
  error: string;
  message?: string;
};

export async function validateInvitationCoupon(
  invitationId: string,
  code: string
): Promise<CouponQuoteResponse> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/payment/coupon/validate`),
    buildRequestInit({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ code }),
    })
  );
  const data = (await response.json().catch(() => ({}))) as CouponQuoteResponse | CouponApiError;
  if (!response.ok || !('ok' in data) || !data.ok) {
    const err = data as CouponApiError;
    throw new Error(err.error || 'COUPON_INVALID');
  }
  return data;
}

export async function settleZeroInvitationPayment(
  invitationId: string,
  paymentId: string
): Promise<{ ok: boolean; alreadyPaid: boolean; paymentId: string; isPaid: boolean }> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/payment/settle-zero`),
    buildRequestInit({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ paymentId }),
    })
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'SETTLE_ZERO_FAILED');
  }
  return response.json();
}
