/**
 * Payment provider names (runtime).
 * Stripe is intentionally not an active provider.
 */
export type PaymentProviderName = 'mock' | 'toss_payments';

export type TossChargeAmount = {
  /** Amount unit expected by Toss API for the selected currency (KRW: won integer). */
  value: number;
  currency: 'KRW' | 'USD';
};

export type PreparePaymentResult =
  | {
      ok: true;
      alreadyPaid: false;
      paymentId: string;
      orderId: string;
      provider: PaymentProviderName;
      orderName: string;
      /** Domain product pricing currency (USD). */
      domainCurrency: string;
      domainChargedAmountCents: number;
      /** Provider charge amount (Toss requestPayment / confirm). */
      amount: TossChargeAmount;
      successUrl: string;
      failUrl: string;
      clientKey: string | null;
    }
  | { ok: true; alreadyPaid: true; paymentId: string }
  | {
      ok: false;
      code:
        | 'ALREADY_PAID'
        | 'UNSUPPORTED_CURRENCY'
        | 'MISSING_TOSS_KEYS'
        | 'PREPARE_FAILED'
        | 'INVALID_PROVIDER';
      message: string;
    };

export type ConfirmPaymentInput = {
  invitationId: string;
  paymentKey: string;
  orderId: string;
  /** Client-reported amount — compared to DB expected provider amount. */
  amount: number;
};
