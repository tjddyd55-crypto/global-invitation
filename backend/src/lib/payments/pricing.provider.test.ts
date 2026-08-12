import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOrderId,
  mapTossPaymentStatus,
  resolvePaymentProvider,
  resolveTossChargeAmount,
} from './provider';
import { INVITATION_PRICING } from '../pricing/invitationPricing';

test('invitation pricing SSOT remains USD 30/10', () => {
  assert.equal(INVITATION_PRICING.currency, 'USD');
  assert.equal(INVITATION_PRICING.listPriceCents, 3000);
  assert.equal(INVITATION_PRICING.salePriceCents, 1000);
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

test('toss CARD without explicit KRW settlement is unsupported for USD product', () => {
  const prevCurrency = process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY;
  const prevAmount = process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT;
  delete process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY;
  delete process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT;
  try {
    const result = resolveTossChargeAmount('toss_payments');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, 'UNSUPPORTED_CURRENCY');
    }
  } finally {
    process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY = prevCurrency;
    process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT = prevAmount;
  }
});

test('explicit KRW settlement is used without FX conversion', () => {
  const prevCurrency = process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY;
  const prevAmount = process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT;
  process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY = 'KRW';
  process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT = '10000';
  try {
    const result = resolveTossChargeAmount('toss_payments');
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.amount.currency, 'KRW');
      assert.equal(result.amount.value, 10000);
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
