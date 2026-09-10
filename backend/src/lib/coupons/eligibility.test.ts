import assert from 'node:assert/strict';
import test from 'node:test';
import { InvitationCouponStatus } from '@prisma/client';
import {
  assertCouponLimits,
  assertCouponWindow,
  resolveEffectiveCouponStatus,
} from './eligibility';
import { CouponError, COUPON_ERROR_CODES } from './errors';

const now = new Date('2026-06-01T00:00:00.000Z');

test('ACTIVE coupon past endsAt is treated as EXPIRED', () => {
  const status = resolveEffectiveCouponStatus(
    {
      status: InvitationCouponStatus.ACTIVE,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-05-01T00:00:00.000Z'),
    },
    now
  );
  assert.equal(status, InvitationCouponStatus.EXPIRED);
});

test('window checks cover draft, not started, and expired', () => {
  assert.throws(
    () =>
      assertCouponWindow(
        { status: InvitationCouponStatus.DRAFT, startsAt: null, endsAt: null },
        now
      ),
    (error: unknown) => error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_INACTIVE
  );
  assert.throws(
    () =>
      assertCouponWindow(
        {
          status: InvitationCouponStatus.ACTIVE,
          startsAt: new Date('2026-07-01T00:00:00.000Z'),
          endsAt: null,
        },
        now
      ),
    (error: unknown) =>
      error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_NOT_STARTED
  );
  assert.throws(
    () =>
      assertCouponWindow(
        {
          status: InvitationCouponStatus.ACTIVE,
          startsAt: null,
          endsAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        now
      ),
    (error: unknown) => error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_EXPIRED
  );
});

test('usage limits count reserved+redeemed, not released', () => {
  assert.throws(
    () => assertCouponLimits({ totalUsageLimit: 1, perUserUsageLimit: null }, { totalActive: 1, userActive: 0 }),
    (error: unknown) =>
      error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_LIMIT_REACHED
  );
  assert.throws(
    () => assertCouponLimits({ totalUsageLimit: null, perUserUsageLimit: 1 }, { totalActive: 0, userActive: 1 }),
    (error: unknown) =>
      error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_USER_LIMIT_REACHED
  );
  assert.doesNotThrow(() =>
    assertCouponLimits({ totalUsageLimit: 2, perUserUsageLimit: 1 }, { totalActive: 1, userActive: 0 })
  );
});
