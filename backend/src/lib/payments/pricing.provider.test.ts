import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOrderId,
  getPaymentOrderName,
  getPrimaryPaymentChannel,
  mapTossPaymentStatus,
  resolvePaymentProvider,
  resolveTossChargeAmount,
  toInternationalUsdChargeAmount,
} from './provider';
import { INVITATION_PRICING } from '../pricing/invitationPricing';

test('invitation pricing SSOT remains USD 30/10', () => {
  assert.equal(INVITATION_PRICING.currency, 'USD');
  assert.equal(INVITATION_PRICING.listPriceCents, 3000);
  assert.equal(INVITATION_PRICING.salePriceCents, 1000);
});

test('primary payment channel is INTERNATIONAL_USD', () => {
  assert.equal(getPrimaryPaymentChannel(), 'INTERNATIONAL_USD');
});

test('USD product minor maps to Toss major units without FX', () => {
  assert.deepEqual(toInternationalUsdChargeAmount(1000), { currency: 'USD', value: 10 });
  assert.deepEqual(toInternationalUsdChargeAmount(3000), { currency: 'USD', value: 30 });
  assert.throws(() => toInternationalUsdChargeAmount(1050), /USD_AMOUNT_MUST_BE_WHOLE_DOLLARS/);
});

test('payment orderName is global-first English by default', () => {
  assert.equal(getPaymentOrderName('ko-KR'), '온라인 초대장 공개 이용권');
  assert.equal(getPaymentOrderName('en-US'), 'Invitation Publishing Access');
  assert.equal(getPaymentOrderName(null), 'Invitation Publishing Access');
});

test('mock provider is rejected in production', () => {
  const prevProvider = process.env.PAYMENT_PROVIDER;
  const prevNodeEnv = process.env.NODE_ENV;
  process.env.PAYMENT_PROVIDER = 'mock';
  process.env.NODE_ENV = 'production';
  try {
    assert.throws(() => resolvePaymentProvider(), /forbidden in production/);
  } finally {
    process.env.PAYMENT_PROVIDER = prevProvider;
    process.env.NODE_ENV = prevNodeEnv;
  }
});

test('stripe provider is disabled', () => {
  const prevProvider = process.env.PAYMENT_PROVIDER;
  const prevNodeEnv = process.env.NODE_ENV;
  process.env.PAYMENT_PROVIDER = 'stripe';
  process.env.NODE_ENV = 'development';
  try {
    assert.throws(() => resolvePaymentProvider(), /stripe is disabled/);
  } finally {
    process.env.PAYMENT_PROVIDER = prevProvider;
    process.env.NODE_ENV = prevNodeEnv;
  }
});

test('toss prepare charge is USD international with no KRW settlement', () => {
  const prevCurrency = process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY;
  const prevAmount = process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT;
  delete process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY;
  delete process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT;
  try {
    const result = resolveTossChargeAmount('toss_payments');
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.channel, 'INTERNATIONAL_USD');
      assert.equal(result.amount.currency, 'USD');
      assert.equal(result.amount.value, 10);
    }
  } finally {
    process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY = prevCurrency;
    process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT = prevAmount;
  }
});

test('legacy KRW settlement env is refused (no silent fallback)', () => {
  const prevCurrency = process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY;
  const prevAmount = process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT;
  process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY = 'KRW';
  process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT = '10000';
  try {
    const result = resolveTossChargeAmount('toss_payments');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, 'DOMESTIC_KRW_DISABLED');
    }
  } finally {
    process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY = prevCurrency;
    process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT = prevAmount;
  }
});

test('orderId respects Toss character constraints', () => {
  const orderId = buildOrderId('550e8400-e29b-41d4-a716-446655440000');
  assert.match(orderId, /^[A-Za-z0-9\-_=]{6,64}$/);
});

test('toss status mapping', () => {
  assert.equal(mapTossPaymentStatus('DONE'), 'PAID');
  assert.equal(mapTossPaymentStatus('CANCELED'), 'CANCELED');
  assert.equal(mapTossPaymentStatus('PARTIAL_CANCELED'), 'REFUNDED');
  assert.equal(mapTossPaymentStatus('ABORTED'), 'FAILED');
  assert.equal(mapTossPaymentStatus('IN_PROGRESS'), 'PENDING');
});
