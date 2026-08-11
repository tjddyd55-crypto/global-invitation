import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getInvitationPricingSnapshot,
  INVITATION_PRICING,
} from '../pricing/invitationPricing';
import { resolvePaymentProvider } from './provider';

test('invitation pricing SSOT is USD 30 list / 10 sale', () => {
  assert.equal(INVITATION_PRICING.currency, 'USD');
  assert.equal(INVITATION_PRICING.listPriceCents, 3000);
  assert.equal(INVITATION_PRICING.salePriceCents, 1000);
  assert.equal(INVITATION_PRICING.promotionKey, 'OPENING');

  const snapshot = getInvitationPricingSnapshot();
  assert.equal(snapshot.chargedAmountCents, 1000);
  assert.equal(snapshot.listPriceCents, 3000);
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
