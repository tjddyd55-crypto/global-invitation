import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPaymentUnavailableCode,
  paymentErrorHttpStatus,
  paymentErrorMessageKo,
} from './errors';

test('unconfigured provider is 503 with Korean user copy, not 500', () => {
  assert.equal(paymentErrorHttpStatus('PAYMENT_PROVIDER_NOT_CONFIGURED'), 503);
  assert.equal(paymentErrorHttpStatus('PAYMENT_SERVICE_NOT_AVAILABLE'), 503);
  assert.equal(paymentErrorHttpStatus('FOREIGN_MID_NOT_CONFIGURED'), 503);
  assert.equal(isPaymentUnavailableCode('PAYMENT_PROVIDER_NOT_CONFIGURED'), true);
  assert.match(paymentErrorMessageKo('PAYMENT_PROVIDER_NOT_CONFIGURED'), /해외 결제 서비스 준비/);
  assert.doesNotMatch(paymentErrorMessageKo('PAYMENT_PROVIDER_NOT_CONFIGURED'), /PAYMENT_PROVIDER|stack|prisma/i);
});

test('confirm snapshot mismatches are typed 409', () => {
  assert.equal(paymentErrorHttpStatus('AMOUNT_MISMATCH'), 409);
  assert.equal(paymentErrorHttpStatus('COUPON_SNAPSHOT_MISMATCH'), 409);
  assert.equal(paymentErrorHttpStatus('RESERVATION_EXPIRED'), 409);
});
