import assert from 'node:assert/strict';
import test from 'node:test';
import { InvitationCouponStatus } from '@prisma/client';
import {
  assertCouponActivationAllowed,
  assertCouponStatusTransition,
} from './statusMachine';
import { CouponError, COUPON_ERROR_CODES } from './errors';

test('ACTIVE ↔ PAUSED transitions are allowed', () => {
  assert.doesNotThrow(() =>
    assertCouponStatusTransition(InvitationCouponStatus.ACTIVE, InvitationCouponStatus.PAUSED)
  );
  assert.doesNotThrow(() =>
    assertCouponStatusTransition(InvitationCouponStatus.PAUSED, InvitationCouponStatus.ACTIVE)
  );
});

test('ACTIVE/PAUSED → ARCHIVED transitions are allowed', () => {
  assert.doesNotThrow(() =>
    assertCouponStatusTransition(InvitationCouponStatus.ACTIVE, InvitationCouponStatus.ARCHIVED)
  );
  assert.doesNotThrow(() =>
    assertCouponStatusTransition(InvitationCouponStatus.PAUSED, InvitationCouponStatus.ARCHIVED)
  );
});

test('ARCHIVED → ACTIVE restore is allowed', () => {
  assert.doesNotThrow(() =>
    assertCouponStatusTransition(InvitationCouponStatus.ARCHIVED, InvitationCouponStatus.ACTIVE)
  );
});

test('ARCHIVED → PAUSED direct transition is rejected', () => {
  assert.throws(
    () => assertCouponStatusTransition(InvitationCouponStatus.ARCHIVED, InvitationCouponStatus.PAUSED),
    (error: unknown) =>
      error instanceof CouponError &&
      error.code === COUPON_ERROR_CODES.COUPON_INVALID_STATUS_TRANSITION
  );
});

test('same-status transition is idempotent', () => {
  assert.doesNotThrow(() =>
    assertCouponStatusTransition(InvitationCouponStatus.ACTIVE, InvitationCouponStatus.ACTIVE)
  );
  assert.doesNotThrow(() =>
    assertCouponStatusTransition(InvitationCouponStatus.ARCHIVED, InvitationCouponStatus.ARCHIVED)
  );
});

test('activation is rejected when endsAt is in the past', () => {
  assert.throws(
    () =>
      assertCouponActivationAllowed(
        { endsAt: new Date('2020-01-01T00:00:00.000Z') },
        new Date('2026-01-01T00:00:00.000Z')
      ),
    (error: unknown) =>
      error instanceof CouponError && error.code === COUPON_ERROR_CODES.COUPON_EXPIRED
  );
});

test('activation is allowed when endsAt is in the future', () => {
  assert.doesNotThrow(() =>
    assertCouponActivationAllowed(
      { endsAt: new Date('2030-01-01T00:00:00.000Z') },
      new Date('2026-01-01T00:00:00.000Z')
    )
  );
});
