import assert from 'node:assert/strict';
import test from 'node:test';
import { InvitationCouponUsageStatus } from '@prisma/client';
import { PENDING_REUSE_WINDOW_MS } from '../payments/constants';
import { reservationExpiresAt } from './lifecycle';
import { isConsumingUsageStatus } from './counts';

test('reservation expiry matches the pending payment reuse window', () => {
  const from = new Date('2026-06-01T00:00:00.000Z');
  const expires = reservationExpiresAt(from);
  assert.equal(expires.getTime() - from.getTime(), PENDING_REUSE_WINDOW_MS);
});

test('only reserved and redeemed usages consume limits; released does not', () => {
  assert.equal(isConsumingUsageStatus(InvitationCouponUsageStatus.RESERVED), true);
  assert.equal(isConsumingUsageStatus(InvitationCouponUsageStatus.REDEEMED), true);
  assert.equal(isConsumingUsageStatus(InvitationCouponUsageStatus.RELEASED), false);
});

test('refund policy keeps redeemed (no automatic release)', () => {
  const afterRefund = InvitationCouponUsageStatus.REDEEMED;
  assert.equal(isConsumingUsageStatus(afterRefund), true);
});
