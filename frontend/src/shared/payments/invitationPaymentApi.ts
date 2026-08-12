import { buildApiUrl, buildRequestInit } from '@/src/shared/api';
import { buildAuthHeaders } from '@/src/lib/auth';

export type InvitationPaymentSummaryResponse = {
  invitationId: string;
  title: string | null;
  templateKey: string;
  status: string;
  shareSlug: string | null;
  isPublished: boolean;
  provider?: string;
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
    provider?: string | null;
  };
};

export type PreparePaymentResponse = {
  paymentId: string;
  orderId: string;
  provider: 'mock' | 'toss_payments';
  orderName: string;
  amount: { value: number; currency: string };
  domainCurrency: string;
  domainChargedAmountCents: number;
  successUrl: string;
  failUrl: string;
  clientKey: string | null;
};

export type PaymentStatusResponse = {
  invitationId: string;
  isPaid: boolean;
  status: string | null;
  paymentId: string | null;
  orderId?: string | null;
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

export async function prepareInvitationPayment(invitationId: string): Promise<PreparePaymentResponse> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/payment/prepare`),
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
    throw new Error('ALREADY_PAID');
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(data.error || 'PREPARE_FAILED');
  }
  return response.json();
}

export async function confirmInvitationPayment(
  invitationId: string,
  payload: { paymentKey: string; orderId: string; amount: number }
): Promise<{ ok: boolean; alreadyPaid: boolean; paymentId: string; isPaid: boolean }> {
  const response = await fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/payment/confirm`),
    buildRequestInit({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'CONFIRM_FAILED');
  }
  return response.json();
}

export async function fetchInvitationPaymentStatus(
  invitationId: string,
  opts?: { paymentId?: string | null; orderId?: string | null }
): Promise<PaymentStatusResponse> {
  const params = new URLSearchParams();
  if (opts?.paymentId) params.set('paymentId', opts.paymentId);
  if (opts?.orderId) params.set('orderId', opts.orderId);
  const qs = params.toString() ? `?${params.toString()}` : '';
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
