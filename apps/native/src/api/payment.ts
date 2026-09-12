import { apiRequest } from '@/src/api/client';

export type PaymentSummaryResponse = {
  invitationId: string;
  title: string | null;
  status: string;
  shareSlug?: string | null;
  provider: string;
  checkout: {
    providerChargeReady: boolean;
    unavailableCode?: string | null;
    message?: string | null;
  };
  pricing: {
    currency: string;
    listPriceCents: number;
    salePriceCents: number;
    discountCents: number;
    promotionKey?: string | null;
  };
  payment: {
    status?: string;
    paidAt?: string | null;
  } | null;
};

export type CouponValidateResponse = {
  ok: boolean;
  currency: string;
  listPriceCents: number;
  salePriceCents: number;
  discountAmountCents: number;
  finalAmountCents: number;
  message?: string;
  error?: string;
};

export async function fetchPaymentSummary(invitationId: string): Promise<PaymentSummaryResponse> {
  return apiRequest<PaymentSummaryResponse>(`/api/invitations/${invitationId}/payment`);
}

export async function validateCoupon(
  invitationId: string,
  couponCode: string,
): Promise<CouponValidateResponse> {
  return apiRequest<CouponValidateResponse>(
    `/api/invitations/${invitationId}/payment/coupon/validate`,
    {
      method: 'POST',
      body: { code: couponCode },
    },
  );
}

export function formatUsd(cents: number, currency = 'USD'): string {
  const amount = cents / 100;
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
}
