import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTossPaymentRequest } from './tossCheckoutMethod';
import type { PreparePaymentResponse } from './invitationPaymentApi';
const base: PreparePaymentResponse = { paymentId: 'id', orderId: 'order', orderName: 'Invitation',
  provider: 'mock', amount: { currency: 'USD', value: 10 }, domainCurrency: 'USD', domainChargedAmountCents: 1000,
  successUrl: 'https://example.com/success', failUrl: 'https://example.com/fail', clientKey: null };

test('overseas card language uses uppercase SDK values', () => {
  assert.equal(cardLanguage('ko-KR'), 'KO');
  assert.equal(cardLanguage('en-US'), 'EN');
});
test('domestic only accepts integer KRW and uses standard card window', () => {
  const domestic = { ...base, checkoutMethod: 'DOMESTIC' as const };
  assert.throws(() => buildTossPaymentRequest(domestic));
  const request = buildTossPaymentRequest({ ...domestic, amount: { currency: 'KRW', value: 13000 } });
  assert.equal(request.method, 'CARD');
  if (request.method === 'CARD') assert.deepEqual(request.card, { flowMode: 'DEFAULT' });
  assert.throws(() => buildTossPaymentRequest({ ...domestic, amount: { currency: 'KRW', value: 1.5 } }));
});
test('overseas methods only accept USD and PayPal requires non-KR country', () => {
  for (const checkoutMethod of ['OVERSEAS_CARD', 'OVERSEAS_EASY_PAY'] as const) {
    assert.throws(() => buildTossPaymentRequest({ ...base, checkoutMethod, amount: { currency: 'KRW', value: 1000 } }));
  }
  const paypal = { ...base, checkoutMethod: 'OVERSEAS_EASY_PAY' as const };
  assert.throws(() => buildTossPaymentRequest(paypal));
  assert.throws(() => buildTossPaymentRequest({ ...paypal, country: 'KR' }));
  const request = buildTossPaymentRequest({ ...paypal, country: 'us' });
  assert.equal(request.method, 'FOREIGN_EASY_PAY');
  if (request.method === 'FOREIGN_EASY_PAY') assert.deepEqual(request.foreignEasyPay, { provider: 'PAYPAL', country: 'US' });
});

function cardLanguage(locale: string) {
  const request = buildTossPaymentRequest(base, locale);
  return request.method === 'CARD' ? request.card.language : null;
}
