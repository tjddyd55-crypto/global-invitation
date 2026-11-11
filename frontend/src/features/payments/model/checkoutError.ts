const CHECKOUT_ERROR_CODES = new Set([
  'DOMESTIC_KRW_DISABLED', 'DOMESTIC_KRW_RATE_NOT_CONFIGURED', 'INVALID_CHECKOUT_METHOD', 'COUNTRY_REQUIRED',
]);
export function checkoutErrorKey(code: string): string {
  return CHECKOUT_ERROR_CODES.has(code) ? `checkout.error.${code}` : 'checkout.failed.body';
}
