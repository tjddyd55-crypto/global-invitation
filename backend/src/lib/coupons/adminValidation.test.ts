import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCreatePayload, normalizeAdminCouponWrite } from './adminValidation';
import { CouponError, COUPON_ERROR_CODES } from './errors';

test('admin write normalizes code and rejects non-whole-dollar fixed amounts', () => {
  const ok = normalizeAdminCouponWrite({
    code: ' jci50 ',
    name: 'JCI 50% 할인',
    organization: 'JCI',
    discountType: 'PERCENT',
    discountValue: 50,
    perUserUsageLimit: 1,
  });
  assert.equal(ok.code, 'JCI50');
  assert.equal(ok.discountType, 'PERCENT');
  assert.equal(ok.perUserUsageLimit, 1);

  assert.throws(
    () =>
      normalizeAdminCouponWrite({
        discountType: 'FIXED_AMOUNT',
        discountValue: 150,
      }),
    (error: unknown) =>
      error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_INVALID_DISCOUNT
  );
});

test('create payload requires code, name, and discount', () => {
  assert.throws(
    () => assertCreatePayload({ name: 'x' }),
    (error: unknown) => error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_INVALID
  );
});
