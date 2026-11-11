import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { InvitationPayment } from '@prisma/client';
import { matchesCheckoutIdentity } from './checkoutIdentity';
import { getExpectedProviderAmount, getExpectedProviderCurrency } from './paymentLookup';

const domestic = { checkoutMethod: 'DOMESTIC', country: null,
  chargeAmount: { currency: 'KRW' as const, value: 13500 }, usdKrwRate: 1350 };
const payment = { provider: 'mock', currency: 'USD', chargedAmount: 1000,
  rawProviderStatus: JSON.stringify({ checkoutMethod: 'DOMESTIC', country: null,
    tossAmount: 13500, tossCurrency: 'KRW', usdKrwRate: 1350 }) } as InvitationPayment;

test('provider expectations use prepared KRW instead of USD product cents', () => {
  assert.equal(getExpectedProviderAmount(payment), 13500);
  assert.equal(getExpectedProviderCurrency(payment), 'KRW');
});
test('pending identity requires method, country, currency, amount and rate to match', () => {
  assert.equal(matchesCheckoutIdentity(payment, domestic), true);
  assert.equal(matchesCheckoutIdentity(payment, { ...domestic, checkoutMethod: 'OVERSEAS_CARD' }), false);
  assert.equal(matchesCheckoutIdentity(payment, { ...domestic, country: 'US' }), false);
  assert.equal(matchesCheckoutIdentity(payment, { ...domestic, chargeAmount: { currency: 'USD', value: 13500 } }), false);
  assert.equal(matchesCheckoutIdentity(payment, { ...domestic, chargeAmount: { currency: 'KRW', value: 13499 } }), false);
  assert.equal(matchesCheckoutIdentity(payment, { ...domestic, usdKrwRate: 1351 }), false);
});
