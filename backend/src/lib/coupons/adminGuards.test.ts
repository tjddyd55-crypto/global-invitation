import assert from 'node:assert/strict';
import test from 'node:test';
import { InvitationCouponDiscountType, InvitationCouponStatus } from '@prisma/client';
import {
  assertActiveCouponEditAllowed,
  assertCouponCodeRenameAllowed,
  economicFieldsChanged,
} from './adminGuards';
import { CouponError, COUPON_ERROR_CODES } from './errors';

const active = {
  id: 'c1',
  code: 'JCI50',
  name: 'JCI',
  organization: 'JCI',
  discountType: InvitationCouponDiscountType.PERCENT,
  discountValue: 50,
  currency: 'USD',
  status: InvitationCouponStatus.ACTIVE,
  startsAt: null,
  endsAt: null,
  totalUsageLimit: 100,
  perUserUsageLimit: 1,
  createdBy: null,
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('ACTIVE economic edits require pause unless explicitly allowed', () => {
  assert.equal(economicFieldsChanged(active, { discountValue: 40 }), true);
  assert.throws(
    () => assertActiveCouponEditAllowed(active, { discountValue: 40 }, false),
    (error: unknown) =>
      error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_ACTIVE_EDIT_REQUIRES_PAUSE
  );
  assert.doesNotThrow(() => assertActiveCouponEditAllowed(active, { name: 'JCI 50' }, false));
  assert.doesNotThrow(() => assertActiveCouponEditAllowed(active, { discountValue: 40 }, true));
});

test('code rename is forbidden when any usage exists', () => {
  assert.throws(
    () => assertCouponCodeRenameAllowed('JCI50', 'JCI50NEW', 1),
    (error: unknown) => error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_CODE_LOCKED
  );
  assert.doesNotThrow(() => assertCouponCodeRenameAllowed('JCI50', 'JCI50NEW', 0));
  assert.doesNotThrow(() => assertCouponCodeRenameAllowed('JCI50', 'JCI50', 3));
});
