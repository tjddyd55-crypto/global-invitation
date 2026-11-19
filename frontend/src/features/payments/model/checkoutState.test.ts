import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canStartCheckout,
  canSubmitCheckout,
  resolveCheckoutSelection,
  isProviderUnavailableCode,
  restorePendingCoupon,
} from './checkoutState';

test('provider unavailable codes stay on checkout, not raw 500', () => {
  assert.equal(isProviderUnavailableCode('PAYMENT_PROVIDER_NOT_CONFIGURED'), true);
  assert.equal(isProviderUnavailableCode('PREPARE_FAILED'), false);
  assert.equal(isProviderUnavailableCode('TOSS_LIVE_KEY_FORBIDDEN_IN_TEST'), true);
});

test('zero-amount coupon can checkout even when provider is not ready', () => {
  assert.equal(canStartCheckout({ providerChargeReady: true, dueCents: 500 }), true);
  assert.equal(canStartCheckout({ providerChargeReady: false, dueCents: 0 }), true);
  assert.equal(canStartCheckout({ providerChargeReady: false, dueCents: 500 }), false);
});

test('paid checkout requires digital consent and keeps provider and busy guards', () => {
  const ready = { providerChargeReady: true, dueCents: 1000, busy: false };
  assert.equal(canSubmitCheckout({ ...ready, digitalConsent: false }), false);
  assert.equal(canSubmitCheckout({ ...ready, digitalConsent: true }), true);
  assert.equal(canSubmitCheckout({ ...ready, digitalConsent: true, busy: true }), false);
  assert.equal(canSubmitCheckout({ ...ready, digitalConsent: true, providerChargeReady: false }), false);
});

test('zero-amount checkout does not require digital consent or a payment provider', () => {
  const free = { providerChargeReady: false, dueCents: 0, busy: false, digitalConsent: false };
  assert.equal(canSubmitCheckout(free), true);
  assert.equal(canSubmitCheckout({ ...free, busy: true }), false);
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


test('locale supplies the default without overriding a user selection', () => {
  assert.equal(resolveCheckoutSelection(null, 'ko-KR'), 'DOMESTIC');
  assert.equal(resolveCheckoutSelection(null, 'en-US'), 'OVERSEAS_CARD');
  assert.equal(resolveCheckoutSelection('OVERSEAS_EASY_PAY', 'ko-KR'), 'OVERSEAS_EASY_PAY');
  assert.equal(resolveCheckoutSelection('DOMESTIC', 'en-US'), 'DOMESTIC');
});
