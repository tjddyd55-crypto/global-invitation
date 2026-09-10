import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canStartCheckout,
  isProviderUnavailableCode,
  restorePendingCoupon,
} from './checkoutState';

test('provider unavailable codes stay on checkout, not raw 500', () => {
  assert.equal(isProviderUnavailableCode('PAYMENT_PROVIDER_NOT_CONFIGURED'), true);
  assert.equal(isProviderUnavailableCode('PREPARE_FAILED'), false);
});

test('zero-amount coupon can checkout even when provider is not ready', () => {
  assert.equal(canStartCheckout({ providerChargeReady: false, dueCents: 0 }), true);
  assert.equal(canStartCheckout({ providerChargeReady: false, dueCents: 500 }), false);
});

test('refresh restores pending coupon from server snapshot', () => {
  const restored = restorePendingCoupon({
    invitationId: 'inv',
    title: 't',
    templateKey: 'basic',
    status: 'DRAFT',
    shareSlug: null,
    isPublished: false,
    pricing: {
      currency: 'USD',
      listPriceCents: 3000,
      salePriceCents: 1000,
      discountCents: 2000,
      promotionKey: 'launch',
    },
    payment: {
      isPaid: false,
      paidAt: null,
      latestStatus: 'PENDING',
      latestPaymentId: 'p1',
      couponCode: 'JCI50',
      discountAmountCents: 500,
      chargedAmountCents: 500,
    },
  });
  assert.equal(restored?.code, 'JCI50');
  assert.equal(restored?.quote.finalAmountCents, 500);
});
