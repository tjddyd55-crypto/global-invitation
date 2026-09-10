const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{4,32}$/;

export function normalizeCouponCode(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
}

export function isValidCouponCode(code: string): boolean {
  return COUPON_CODE_PATTERN.test(code);
}

export function parseCouponCode(value: unknown): string | null {
  const code = normalizeCouponCode(value);
  return isValidCouponCode(code) ? code : null;
}
