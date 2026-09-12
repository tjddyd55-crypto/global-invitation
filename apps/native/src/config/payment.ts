export type NativePaymentMode =
  | 'DISABLED_PENDING_POLICY'
  | 'WEB_CHECKOUT_ALLOWED'
  | 'STORE_IAP_REQUIRED';

/** App Store / Play policy review pending — no live charge in native. */
export const NATIVE_PAYMENT_MODE: NativePaymentMode = 'DISABLED_PENDING_POLICY';

export function isNativePaymentCtaEnabled(checkoutReady?: boolean): boolean {
  if (NATIVE_PAYMENT_MODE === 'DISABLED_PENDING_POLICY') return false;
  if (NATIVE_PAYMENT_MODE === 'STORE_IAP_REQUIRED') return false;
  return Boolean(checkoutReady);
}
