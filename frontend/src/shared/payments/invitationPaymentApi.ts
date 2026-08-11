import { buildApiUrl, buildRequestInit } from '@/src/shared/api';
import { buildAuthHeaders } from '@/src/lib/auth';

export type InvitationPaymentSummaryResponse = {
  invitationId: string;
  title: string | null;
  templateKey: string;
  status: string;
  shareSlug: string | null;
  isPublished: boolean;
  pricing: {
    currency: string;
    listPriceCents: number;
    salePriceCents: number;
    discountCents: number;
    promotionKey: string;
  };
  payment: {
    isPaid: boolean;
    paidAt: string | null;
    latestStatus: string | null;
    latestPaymentId: string | null;
  };
};

export type PaymentStatusResponse = {
  invitationId: string;
  isPaid: boolean;
  status: string | null;
  paymentId: string | null;
  paidAt: string | null;
  chargedAmount: number | null;
  currency: string | null;
};

export async function fetchInvitationPaymentSummary(
  invitationId: string
): Promise<InvitationPaymentSummaryResponse> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/payment`),
    buildRequestInit({
      method: 'GET',
      headers: {
        ...buildAuthHeaders(),
      },
      cache: 'no-store',
    })
  );
  if (response.status === 401 || response.status === 403) {
    throw new Error('FORBIDDEN');
  }
  if (response.status === 404) {
    throw new Error('NOT_FOUND');
  }
  if (!response.ok) {
    throw new Error('PAYMENT_SUMMARY_FAILED');
  }
  return response.json();
}

export async function createInvitationCheckout(invitationId: string): Promise<{
  paymentId: string;
  checkoutUrl: string;
  provider: string;
}> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/payment/checkout`),
    buildRequestInit({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({}),
    })
  );
  if (response.status === 409) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'ALREADY_PAID');
  }
  if (!response.ok) {
    throw new Error('CHECKOUT_FAILED');
  }
  return response.json();
}

export async function fetchInvitationPaymentStatus(
  invitationId: string,
  paymentId?: string | null
): Promise<PaymentStatusResponse> {
  const qs = paymentId ? `?paymentId=${encodeURIComponent(paymentId)}` : '';
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/payment/status${qs}`),
    buildRequestInit({
      method: 'GET',
      headers: {
        ...buildAuthHeaders(),
      },
      cache: 'no-store',
    })
  );
  if (!response.ok) {
    throw new Error('PAYMENT_STATUS_FAILED');
  }
  return response.json();
}
