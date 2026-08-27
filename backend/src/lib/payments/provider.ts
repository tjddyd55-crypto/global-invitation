import { INVITATION_PRICING } from '../pricing/invitationPricing';
import type { PaymentChannel, PaymentProviderName, TossChargeAmount } from './types';

function resolveNodeEnv(): string {
  return (process.env.NODE_ENV || 'development').toLowerCase();
}

export function resolvePaymentProvider(): PaymentProviderName {
  const raw = (process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();
  const nodeEnv = resolveNodeEnv();

  if (raw === 'mock') {
    if (nodeEnv === 'production') {
      throw new Error('PAYMENT_PROVIDER=mock is forbidden in production');
    }
    return 'mock';
  }

  if (raw === 'toss' || raw === 'toss_payments' || raw === 'tosspayments') {
    return 'toss_payments';
  }

  if (raw === 'stripe') {
    throw new Error('PAYMENT_PROVIDER=stripe is disabled; use toss_payments or mock');
  }

  // development default without explicit provider: mock
  if (nodeEnv !== 'production') {
    return 'mock';
  }

  throw new Error('PAYMENT_PROVIDER is not configured (expected toss_payments)');
}

/** Canonical active channel for this product: overseas USD (외화결제 MID). */
export function getPrimaryPaymentChannel(): PaymentChannel {
  return 'INTERNATIONAL_USD';
}

export function getFrontendBaseUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getTossSecretKey(): string {
  const secret = process.env.TOSS_PAYMENTS_SECRET_KEY?.trim() || '';
  if (!secret) {
    throw new Error('TOSS_PAYMENTS_SECRET_KEY is required');
  }
  return secret;
}

export function getTossClientKey(): string {
  return (
    process.env.TOSS_PAYMENTS_CLIENT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY?.trim() ||
    ''
  );
}

/** Optional Toss admin variantKey for 외화결제 MID (payment window / widgets). */
export function getTossVariantKey(): string | null {
  const value =
    process.env.TOSS_PAYMENTS_VARIANT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TOSS_PAYMENTS_VARIANT_KEY?.trim() ||
    '';
  return value || null;
}

/**
 * test_* / live_* key pair guard.
 * Rejects mixed environments and production mock/test misuse.
 */
export function assertTossKeySafety(clientKey: string, secretKey: string): void {
  const nodeEnv = resolveNodeEnv();
  const clientTest = clientKey.startsWith('test_');
  const clientLive = clientKey.startsWith('live_');
  const secretTest = secretKey.startsWith('test_');
  const secretLive = secretKey.startsWith('live_');

  if ((clientTest && secretLive) || (clientLive && secretTest)) {
    throw new Error('TOSS_KEY_MISMATCH: client/secret test/live keys must match');
  }

  if (nodeEnv === 'production') {
    if (clientTest || secretTest) {
      throw new Error('TOSS_TEST_KEY_FORBIDDEN_IN_PRODUCTION');
    }
  } else if (clientLive || secretLive) {
    throw new Error('TOSS_LIVE_KEY_FORBIDDEN_IN_NON_PRODUCTION');
  }
}

/**
 * Domain minor units (USD cents) → Toss provider charge amount.
 * Product SSOT stays USD cents. Toss USD 외화결제 uses major currency units (e.g. $10 → 10).
 * Never invent FX / KRW settlement here.
 *
 * @see https://docs.tosspayments.com/guides/v2/learn/foreign-payment
 */
export function toInternationalUsdChargeAmount(productAmountMinor: number): TossChargeAmount {
  if (!Number.isInteger(productAmountMinor) || productAmountMinor <= 0) {
    throw new Error('INVALID_PRODUCT_AMOUNT');
  }
  if (productAmountMinor % 100 !== 0) {
    // Toss USD major-unit integer; fractional cents need explicit product decision.
    throw new Error('USD_AMOUNT_MUST_BE_WHOLE_DOLLARS');
  }
  return {
    currency: 'USD',
    value: productAmountMinor / 100,
  };
}

/**
 * Resolve provider charge for the active payment channel.
 *
 * PRIMARY: INTERNATIONAL_USD — Product USD → Charge USD (same currency, no FX).
 * SECONDARY DOMESTIC_KRW: not enabled; never silent-fallback from missing USD MID.
 */
export function resolveTossChargeAmount(provider: PaymentProviderName):
  | { ok: true; amount: TossChargeAmount; channel: PaymentChannel }
  | {
      ok: false;
      code: 'FOREIGN_MID_NOT_CONFIGURED' | 'UNSUPPORTED_CURRENCY' | 'DOMESTIC_KRW_DISABLED';
      message: string;
    } {
  if (INVITATION_PRICING.currency !== 'USD') {
    return {
      ok: false,
      code: 'UNSUPPORTED_CURRENCY',
      message: `Canonical product currency must be USD (got ${INVITATION_PRICING.currency})`,
    };
  }

  const channel = getPrimaryPaymentChannel();

  if (provider === 'mock') {
    return {
      ok: true,
      channel,
      amount: toInternationalUsdChargeAmount(INVITATION_PRICING.salePriceCents),
    };
  }

  // Explicitly refuse any legacy KRW settlement env as a product charge path.
  const settlementCurrency = (process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY || '').trim().toUpperCase();
  if (settlementCurrency === 'KRW') {
    return {
      ok: false,
      code: 'DOMESTIC_KRW_DISABLED',
      message:
        'Domestic KRW settlement is secondary and disabled. Canonical checkout is INTERNATIONAL_USD. ' +
        'Remove TOSS_PAYMENTS_SETTLEMENT_CURRENCY=KRW and configure a Toss 외화결제 (USD) MID.',
    };
  }

  try {
    return {
      ok: true,
      channel,
      amount: toInternationalUsdChargeAmount(INVITATION_PRICING.salePriceCents),
    };
  } catch (error) {
    return {
      ok: false,
      code: 'UNSUPPORTED_CURRENCY',
      message: error instanceof Error ? error.message : 'Unable to map USD product amount',
    };
  }
}

export function buildOrderId(paymentAttemptId: string): string {
  // Toss: 6–64 chars, [A-Za-z0-9-_=]
  const compact = paymentAttemptId.replace(/-/g, '');
  return `gi_${compact}`.slice(0, 64);
}

/** Toss checkout orderName — short, no PII. Global-first default = EN. */
export function getPaymentOrderName(locale?: string | null): string {
  const normalized = (locale || '').toLowerCase();
  if (normalized.startsWith('ko')) {
    return '온라인 초대장 공개 이용권';
  }
  return 'Invitation Publishing Access';
}

/** Safe readiness snapshot for /health — never includes key values. */
export function getPaymentDiagnostics(): {
  provider: PaymentProviderName | 'unconfigured' | 'error';
  mode: PaymentChannel;
  currency: 'USD';
  tossClientKeyConfigured: boolean;
  tossSecretKeyConfigured: boolean;
  tossVariantKeyConfigured: boolean;
  domesticKrwEnabled: false;
  mockAllowed: boolean;
} {
  const nodeEnv = resolveNodeEnv();
  const mockAllowed = nodeEnv !== 'production';
  const tossClientKeyConfigured = Boolean(getTossClientKey());
  const tossSecretKeyConfigured = Boolean(process.env.TOSS_PAYMENTS_SECRET_KEY?.trim());
  const tossVariantKeyConfigured = Boolean(getTossVariantKey());

  try {
    return {
      provider: resolvePaymentProvider(),
      mode: getPrimaryPaymentChannel(),
      currency: 'USD',
      tossClientKeyConfigured,
      tossSecretKeyConfigured,
      tossVariantKeyConfigured,
      domesticKrwEnabled: false,
      mockAllowed,
    };
  } catch {
    return {
      provider: 'error',
      mode: getPrimaryPaymentChannel(),
      currency: 'USD',
      tossClientKeyConfigured,
      tossSecretKeyConfigured,
      tossVariantKeyConfigured,
      domesticKrwEnabled: false,
      mockAllowed,
    };
  }
}

export function mapTossPaymentStatus(
  status: string | null | undefined
): 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'REFUNDED' | null {
  switch ((status || '').toUpperCase()) {
    case 'DONE':
      return 'PAID';
    case 'CANCELED':
      return 'CANCELED';
    case 'PARTIAL_CANCELED':
      return 'REFUNDED';
    case 'ABORTED':
    case 'EXPIRED':
      return 'FAILED';
    case 'READY':
    case 'IN_PROGRESS':
    case 'WAITING_FOR_DEPOSIT':
      return 'PENDING';
    default:
      return null;
  }
}
