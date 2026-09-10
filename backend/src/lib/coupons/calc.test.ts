import assert from 'node:assert/strict';
import test from 'node:test';
import { computeCouponQuote, isZeroAmountQuote } from './calc';

test('PERCENT 50 off $10 sale is $5', () => {
  const quote = computeCouponQuote({
    baseAmountCents: 1000,
    discountType: 'PERCENT',
    discountValue: 50,
  });
  assert.deepEqual(quote, {
    baseAmountCents: 1000,
    discountAmountCents: 500,
    finalAmountCents: 500,
  });
});

test('PERCENT 100 produces a zero-amount quote', () => {
  const quote = computeCouponQuote({
    baseAmountCents: 1000,
    discountType: 'PERCENT',
    discountValue: 100,
  });
  assert.equal(quote.finalAmountCents, 0);
  assert.equal(quote.discountAmountCents, 1000);
  assert.equal(isZeroAmountQuote(quote), true);
});

test('FIXED_AMOUNT cannot exceed the sale-price base', () => {
  const quote = computeCouponQuote({
    baseAmountCents: 1000,
    discountType: 'FIXED_AMOUNT',
    discountValue: 3000,
  });
  assert.equal(quote.finalAmountCents, 0);
  assert.equal(quote.discountAmountCents, 1000);
});

test('FIXED_AMOUNT $3 off $10 leaves $7', () => {
  const quote = computeCouponQuote({
    baseAmountCents: 1000,
    discountType: 'FIXED_AMOUNT',
    discountValue: 300,
  });
  assert.deepEqual(quote, {
    baseAmountCents: 1000,
    discountAmountCents: 300,
    finalAmountCents: 700,
  });
});

test('invalid percent is rejected', () => {
  assert.throws(
    () =>
      computeCouponQuote({
        baseAmountCents: 1000,
        discountType: 'PERCENT',
        discountValue: 0,
      }),
    /INVALID_PERCENT_VALUE/
  );
});
