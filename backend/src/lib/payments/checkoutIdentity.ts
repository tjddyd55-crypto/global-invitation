import type { InvitationPayment } from '@prisma/client';
import { parseCheckoutMethod, parsePaymentCountry } from './checkoutMethod';
import { getExpectedProviderAmount, getExpectedProviderCurrency, parseProviderMeta } from './paymentLookup';
import type { TossChargeAmount } from './types';

export type CheckoutIdentity = { checkoutMethod?: unknown; country?: unknown;
  chargeAmount: TossChargeAmount; usdKrwRate: number | null };
export function matchesCheckoutIdentity(payment: InvitationPayment, input: CheckoutIdentity): boolean {
  const meta = parseProviderMeta(payment.rawProviderStatus);
  return (meta.checkoutMethod ?? 'OVERSEAS_CARD') === parseCheckoutMethod(input.checkoutMethod)
    && (meta.country ?? null) === parsePaymentCountry(input.country)
    && getExpectedProviderAmount(payment) === input.chargeAmount.value
    && getExpectedProviderCurrency(payment) === input.chargeAmount.currency
    && (meta.usdKrwRate ?? null) === input.usdKrwRate;
}
