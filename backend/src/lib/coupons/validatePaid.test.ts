import assert from 'node:assert/strict';
import test from 'node:test';
import { CouponError, COUPON_ERROR_CODES, toPublicCouponError } from './errors';
import { validateCouponForInvitation } from './service';

test('paid invitations cannot apply or re-apply a coupon', async () => {
  await assert.rejects(
    () =>
      validateCouponForInvitation({
        code: 'JCI50',
        invitationId: 'inv',
        userId: 'user',
        alreadyPaid: true,
      }),
    (error: unknown) =>
      error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_ALREADY_PAID
  );
});

test('public validate hides admin-only error details', () => {
  assert.equal(toPublicCouponError('COUPON_CODE_TAKEN'), 'COUPON_INVALID');
  assert.equal(toPublicCouponError('COUPON_EXPIRED'), 'COUPON_EXPIRED');
  assert.equal(toPublicCouponError('COUPON_RATE_LIMITED'), 'COUPON_RATE_LIMITED');
});
