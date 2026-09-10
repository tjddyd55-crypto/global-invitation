import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertPreparedAmountMatch,
  assertPreparedCurrencyMatch,
  matchCouponSnapshotAtConfirm,
} from './confirmSnapshot';

test('client amount must match prepared provider amount', () => {
  assert.equal(assertPreparedAmountMatch(5, 5).ok, true);
  assert.deepEqual(assertPreparedAmountMatch(5, 10), { ok: false, code: 'AMOUNT_MISMATCH' });
  assert.deepEqual(assertPreparedAmountMatch(null, 5), { ok: false, code: 'AMOUNT_MISMATCH' });
});

test('currency mismatch is typed and never paid', () => {
  assert.equal(assertPreparedCurrencyMatch('USD', 'usd').ok, true);
  assert.deepEqual(assertPreparedCurrencyMatch('USD', 'KRW'), { ok: false, code: 'CURRENCY_MISMATCH' });
});

test('legacy payments without coupon snapshot are allowed', () => {
  const result = matchCouponSnapshotAtConfirm(
    { chargedAmount: 1000, currency: 'USD', couponId: null },
    null
  );
  assert.equal(result.ok, true);
});

test('coupon snapshot mismatch or expired reservation fails confirm', () => {
  const payment = {
    couponId: 'c1',
    couponCode: 'JCI50',
    couponDiscountType: 'PERCENT' as const,
    couponDiscountValue: 50,
    chargedAmount: 500,
    currency: 'USD',
  };
  const usage = {
    status: 'RESERVED',
    codeSnapshot: 'JCI50',
    discountType: 'PERCENT',
    discountValue: 50,
    finalAmountCents: 500,
    expiresAt: new Date('2026-09-11T00:00:00.000Z'),
  };
  assert.equal(matchCouponSnapshotAtConfirm(payment, usage, new Date('2026-09-10T00:00:00.000Z')).ok, true);
  assert.deepEqual(
    matchCouponSnapshotAtConfirm({ ...payment, chargedAmount: 1000 }, usage),
    { ok: false, code: 'COUPON_SNAPSHOT_MISMATCH' }
  );
  assert.deepEqual(
    matchCouponSnapshotAtConfirm(payment, { ...usage, expiresAt: new Date('2026-09-09T00:00:00.000Z') }, new Date('2026-09-10T00:00:00.000Z')),
    { ok: false, code: 'RESERVATION_EXPIRED' }
  );
});
