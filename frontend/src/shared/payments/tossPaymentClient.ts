'use client';
/* eslint-disable i18next/no-literal-string */

import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import type { PreparePaymentResponse } from '@/src/shared/payments/invitationPaymentApi';

function resolveCheckoutLanguage(locale?: string | null): 'en' | 'ko' {
  const normalized = (locale || '').toLowerCase();
  return normalized.startsWith('ko') ? 'ko' : 'en';
}

/**
 * Toss Payments JS SDK v2 — INTERNATIONAL_USD primary checkout.
 * Requires Toss 외화결제 (USD) MID. Domestic KRW CARD is not a silent fallback.
 * @see https://docs.tosspayments.com/guides/v2/learn/foreign-payment
 * @see https://docs.tosspayments.com/sdk/v2/js
 */
export async function requestTossPaymentWindow(
  prepared: PreparePaymentResponse,
  opts?: { locale?: string | null }
): Promise<void> {
  if (!prepared.clientKey) {
    throw new Error('FOREIGN_MID_NOT_CONFIGURED');
  }

  if (prepared.paymentChannel && prepared.paymentChannel !== 'INTERNATIONAL_USD') {
    throw new Error('DOMESTIC_KRW_DISABLED');
  }

  if (prepared.amount.currency !== 'USD') {
    throw new Error('UNSUPPORTED_CURRENCY');
  }

  const tossPayments = await loadTossPayments(prepared.clientKey);
  const paymentOptions: { customerKey: typeof ANONYMOUS; variantKey?: string } = {
    customerKey: ANONYMOUS,
  };
  if (prepared.variantKey) {
    paymentOptions.variantKey = prepared.variantKey;
  }
  const payment = tossPayments.payment(paymentOptions);

  // USD 외화결제 MID + international card window (Visa/MC/JCB/AMEX/UnionPay per contract).
  const request = {
    method: 'CARD' as const,
    amount: {
      currency: 'USD' as const,
      value: prepared.amount.value,
    },
    orderId: prepared.orderId,
    orderName: prepared.orderName,
    successUrl: prepared.successUrl,
    failUrl: prepared.failUrl,
    card: {
      flowMode: 'DEFAULT' as const,
      useInternationalCardOnly: true,
      language: resolveCheckoutLanguage(opts?.locale),
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
