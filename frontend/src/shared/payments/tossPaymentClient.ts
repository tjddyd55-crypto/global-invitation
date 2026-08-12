'use client';
/* eslint-disable i18next/no-literal-string */

import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import type { PreparePaymentResponse } from '@/src/shared/payments/invitationPaymentApi';

/**
 * Toss Payments JS SDK v2 — payment window (CARD / 통합결제창).
 * Official docs: 일반결제 currency is KRW only.
 * @see https://docs.tosspayments.com/sdk/v2/js
 */
export async function requestTossPaymentWindow(prepared: PreparePaymentResponse): Promise<void> {
  if (!prepared.clientKey) {
    throw new Error('MISSING_CLIENT_KEY');
  }

  if (prepared.amount.currency !== 'KRW') {
    throw new Error('UNSUPPORTED_CURRENCY');
  }

  const tossPayments = await loadTossPayments(prepared.clientKey);
  const payment = tossPayments.payment({ customerKey: ANONYMOUS });

  // SDK overloads end with FOREIGN_EASY_PAY; pin CARD+KRW for 일반 통합결제창.
  const request = {
    method: 'CARD' as const,
    amount: {
      currency: 'KRW' as const,
      value: prepared.amount.value,
    },
    orderId: prepared.orderId,
    orderName: prepared.orderName,
    successUrl: prepared.successUrl,
    failUrl: prepared.failUrl,
    card: {
      flowMode: 'DEFAULT' as const,
      useInternationalCardOnly: true,
      language: 'EN' as const,
      showEstimatedAmount: true,
    },
  };

  await payment.requestPayment(request);
}
/** Development mock: emulate Toss success redirect without SDK. */
export function redirectMockPaymentSuccess(prepared: PreparePaymentResponse): void {
  const url = new URL(prepared.successUrl);
  url.searchParams.set('paymentKey', `mock_pk_${prepared.paymentId}`);
  url.searchParams.set('orderId', prepared.orderId);
  url.searchParams.set('amount', String(prepared.amount.value));
  window.location.assign(url.toString());
}
