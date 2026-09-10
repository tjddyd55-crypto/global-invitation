import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCouponValidateRateLimitKey, consumeCouponValidateAttempt } from './rateLimit';

test('validate rate limit keys include user and IP', () => {
  const left = buildCouponValidateRateLimitKey('1.1.1.1', 'user-a', 'inv-1');
  const right = buildCouponValidateRateLimitKey('1.1.1.1', 'user-b', 'inv-1');
  assert.notEqual(left, right);
  assert.match(left, /^coupon-validate:/);
});

test('brute-force validate is limited per IP and per user+IP', () => {
  const previous = process.env.RAILWAY_ENVIRONMENT_NAME;
  process.env.RAILWAY_ENVIRONMENT_NAME = 'production';
  try {
    let limited = false;
    for (let i = 0; i < 12; i += 1) {
      const result = consumeCouponValidateAttempt('9.9.9.9', 'user-limit', 'inv-rate-limit');
      if (result.limited) {
        limited = true;
        break;
      }
    }
    assert.equal(limited, true);
  } finally {
    process.env.RAILWAY_ENVIRONMENT_NAME = previous;
  }
});
