'use client';
/* eslint-disable i18next/no-literal-string */

import { buildTossPaymentRequest } from './tossCheckoutMethod';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import type { PreparePaymentResponse } from '@/src/shared/payments/invitationPaymentApi';

export async function requestTossPaymentWindow(
  prepared: PreparePaymentResponse,
  opts?: { locale?: string | null }
): Promise<void> {
  if (!prepared.clientKey) throw new Error('FOREIGN_MID_NOT_CONFIGURED');
  const request = buildTossPaymentRequest(prepared, opts?.locale);
  const tossPayments = await loadTossPayments(prepared.clientKey);
  const payment = tossPayments.payment({ customerKey: ANONYMOUS,
    ...(prepared.variantKey ? { variantKey: prepared.variantKey } : {}) });
  if (request.method === 'CARD') await payment.requestPayment(request);
  else await payment.requestPayment(request);
}

/** Development mock: emulate Toss success redirect without SDK. */
export function redirectMockPaymentSuccess(prepared: PreparePaymentResponse): void {
  const url = new URL(prepared.successUrl);
  url.searchParams.set('paymentKey', `mock_pk_${prepared.paymentId}`);
  url.searchParams.set('orderId', prepared.orderId);
  url.searchParams.set('amount', String(prepared.amount.value));
  window.location.assign(url.toString());
}
