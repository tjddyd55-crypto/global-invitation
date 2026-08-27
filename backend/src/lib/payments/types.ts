/**
 * Payment provider names (runtime).
 * Stripe is intentionally not an active provider.
 */
export type PaymentProviderName = 'mock' | 'toss_payments';

/**
 * INTERNATIONAL_USD — primary (Toss 외화결제 MID, overseas card / optional PayPal later).
 * DOMESTIC_KRW — secondary, not enabled in runtime yet (separate KRW MID later).
 */
export type PaymentChannel = 'INTERNATIONAL_USD' | 'DOMESTIC_KRW';

export type TossChargeAmount = {
  /**
   * Provider charge unit expected by Toss for the selected currency.
   * USD (외화결제): major units (e.g. 10 = $10).
   * KRW (future domestic): won integer — not used as canonical product path.
   */
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
      paymentChannel: PaymentChannel;
      orderName: string;
      /** Domain product pricing currency (USD). */
      domainCurrency: string;
      /** Domain product amount in minor units (USD cents). */
      productAmountMinor: number;
      domainChargedAmountCents: number;
      /** Provider charge amount (Toss requestPayment / confirm). */
      amount: TossChargeAmount;
      successUrl: string;
      failUrl: string;
      clientKey: string | null;
      variantKey: string | null;
    }
  | { ok: true; alreadyPaid: true; paymentId: string }
  | {
      ok: false;
      code:
        | 'ALREADY_PAID'
        | 'UNSUPPORTED_CURRENCY'
        | 'FOREIGN_MID_NOT_CONFIGURED'
        | 'DOMESTIC_KRW_DISABLED'
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
