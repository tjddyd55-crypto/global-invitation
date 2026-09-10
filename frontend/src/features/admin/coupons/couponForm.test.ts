import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCouponPayload, EMPTY_COUPON_DRAFT } from './couponForm';

test('JCI50 draft builds a percent payload', () => {
  const built = buildCouponPayload({
    ...EMPTY_COUPON_DRAFT,
    code: 'JCI50',
    name: 'JCI 50% 할인',
    organization: 'JCI',
    discountType: 'PERCENT',
    discountValue: '50',
    perUserUsageLimit: '1',
  });
  assert.equal(built.ok, true);
  if (built.ok) {
    assert.equal(built.payload.discountType, 'PERCENT');
    assert.equal(built.payload.discountValue, 50);
    assert.equal(built.payload.perUserUsageLimit, 1);
  }
});

test('fixed amount must be whole dollars in cents', () => {
  const built = buildCouponPayload({
    ...EMPTY_COUPON_DRAFT,
    code: 'OFF150',
    name: 'Bad',
    discountType: 'FIXED_AMOUNT',
    discountValue: '150',
  });
  assert.equal(built.ok, false);
});
