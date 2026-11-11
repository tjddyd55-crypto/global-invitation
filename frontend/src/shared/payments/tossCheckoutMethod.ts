import type { PreparePaymentResponse } from './invitationPaymentApi';

export type CheckoutMethod = 'DOMESTIC' | 'OVERSEAS_CARD' | 'OVERSEAS_EASY_PAY';

export function buildTossPaymentRequest(prepared: PreparePaymentResponse, locale?: string | null) {
  const method = prepared.checkoutMethod ?? 'OVERSEAS_CARD';
  const currency = prepared.amount.currency;
  if (!Number.isFinite(prepared.amount.value) || prepared.amount.value <= 0) throw new Error('INVALID_AMOUNT');
  if (method === 'DOMESTIC' && (currency !== 'KRW' || !Number.isInteger(prepared.amount.value))) {
    throw new Error('DOMESTIC_REQUIRES_KRW');
  }
  if (method !== 'DOMESTIC' && currency !== 'USD') throw new Error('OVERSEAS_REQUIRES_USD');
  const common = { amount: { currency: currency as 'KRW' | 'USD', value: prepared.amount.value },
    orderId: prepared.orderId, orderName: prepared.orderName,
    successUrl: prepared.successUrl, failUrl: prepared.failUrl };
  if (method === 'DOMESTIC') return { ...common, method: 'CARD' as const, card: { flowMode: 'DEFAULT' as const } };
  if (method === 'OVERSEAS_CARD') return { ...common, method: 'CARD' as const,
    card: { flowMode: 'DEFAULT' as const, useInternationalCardOnly: true,
      language: (locale?.toLowerCase().startsWith('ko') ? 'KO' : 'EN') as 'KO' | 'EN' } };
  const country = prepared.country?.toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country) || country === 'KR') throw new Error('COUNTRY_REQUIRED');
  return { ...common, method: 'FOREIGN_EASY_PAY' as const,
    foreignEasyPay: { provider: 'PAYPAL' as const, country } };
}
