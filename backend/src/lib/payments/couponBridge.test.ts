import assert from 'node:assert/strict';
import test from 'node:test';
import { paymentSnapshotFields, sameCouponSnapshot } from './couponBridge';

test('null coupon snapshot leaves legacy payment rows unchanged', () => {
  assert.deepEqual(paymentSnapshotFields(null), {
    couponId: null,
    couponCode: null,
    couponDiscountType: null,
    couponDiscountValue: null,
    baseAmountCents: null,
    discountAmountCents: null,
  });
});

test('pending reuse requires matching coupon code and charged amount', () => {
  const snapshot = {
    couponId: 'c1',
    couponCode: 'JCI50',
    couponDiscountType: 'PERCENT' as const,
    couponDiscountValue: 50,
    baseAmountCents: 1000,
    discountAmountCents: 500,
    chargedAmountCents: 500,
  };
  assert.equal(sameCouponSnapshot({ couponCode: 'JCI50', chargedAmount: 500 }, snapshot, 500), true);
  assert.equal(sameCouponSnapshot({ couponCode: null, chargedAmount: 1000 }, snapshot, 500), false);
  assert.equal(sameCouponSnapshot({ couponCode: 'JCI50', chargedAmount: 1000 }, snapshot, 500), false);
});
