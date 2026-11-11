import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertUsdCentsToKrw, isValidUsdKrwRate, parseCheckoutMethod, parsePaymentCountry } from './checkoutMethod';

test('KRW uses charged USD cents with half up whole won rounding', () => {
  assert.equal(convertUsdCentsToKrw(123, 1350), 1661);
  assert.equal(convertUsdCentsToKrw(0, 1350), 0);
  assert.equal(convertUsdCentsToKrw(500, 1350), 6750);
});
test('fixed rate must be an integer in range', () => {
  for (const rate of [null, undefined, 99, 10001, 1350.5, '1350', NaN]) assert.equal(isValidUsdKrwRate(rate), false);
  assert.equal(isValidUsdKrwRate(100), true);
  assert.equal(isValidUsdKrwRate(10000), true);
  assert.throws(() => convertUsdCentsToKrw(100, 99));
});
test('methods default only when omitted and countries exclude KR', () => {
  assert.equal(parseCheckoutMethod(undefined), 'OVERSEAS_CARD');
  for (const method of ['DOMESTIC', 'OVERSEAS_CARD', 'OVERSEAS_EASY_PAY']) assert.equal(parseCheckoutMethod(method), method);
  assert.equal(parseCheckoutMethod('invalid'), null);
  assert.equal(parsePaymentCountry('us'), 'US');
  assert.equal(parsePaymentCountry('KR'), null);
  assert.equal(parsePaymentCountry(''), null);
});


test('unknown country code is rejected', () => {
  assert.equal(parsePaymentCountry('ZZ'), null);
});
