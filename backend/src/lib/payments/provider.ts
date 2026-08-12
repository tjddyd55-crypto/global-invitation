import { INVITATION_PRICING } from '../pricing/invitationPricing';
import type { PaymentProviderName, TossChargeAmount } from './types';

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
 * Official Toss docs: 일반결제(CARD) supports KRW only. PayPal FOREIGN_EASY_PAY supports USD only.
 * Product SSOT remains USD. We never invent FX conversion.
 *
 * Settlement options:
 * - mock: use domain USD cents as numeric amount (dev only)
 * - toss + TOSS_PAYMENTS_SETTLEMENT_CURRENCY=KRW + TOSS_PAYMENTS_SETTLEMENT_AMOUNT=<won>
 *   → explicit KRW charge decided outside FX code
 * - otherwise UNSUPPORTED_CURRENCY
 */
export function resolveTossChargeAmount(provider: PaymentProviderName):
  | { ok: true; amount: TossChargeAmount }
  | { ok: false; code: 'UNSUPPORTED_CURRENCY'; message: string } {
  if (provider === 'mock') {
    return {
      ok: true,
      amount: {
        currency: 'USD',
        value: INVITATION_PRICING.salePriceCents,
      },
    };
  }

  const settlementCurrency = (process.env.TOSS_PAYMENTS_SETTLEMENT_CURRENCY || '').trim().toUpperCase();
  const settlementAmountRaw = (process.env.TOSS_PAYMENTS_SETTLEMENT_AMOUNT || '').trim();

  if (settlementCurrency === 'KRW' && settlementAmountRaw) {
    const value = Number(settlementAmountRaw);
    if (!Number.isInteger(value) || value <= 0) {
      return {
        ok: false,
        code: 'UNSUPPORTED_CURRENCY',
        message: 'TOSS_PAYMENTS_SETTLEMENT_AMOUNT must be a positive integer (KRW)',
      };
    }
    return { ok: true, amount: { currency: 'KRW', value } };
  }

  if (INVITATION_PRICING.currency === 'USD') {
    return {
      ok: false,
      code: 'UNSUPPORTED_CURRENCY',
      message:
        'Toss 일반결제(CARD)는 KRW만 지원합니다. 제품 가격은 USD이며 임의 환율 변환을 하지 않습니다. ' +
        'KRW 정액 결제를 쓰려면 TOSS_PAYMENTS_SETTLEMENT_CURRENCY=KRW 와 TOSS_PAYMENTS_SETTLEMENT_AMOUNT를 명시적으로 설정하세요. ' +
        'USD 직접 결제는 해외 간편결제(PayPal 등) MID 계약이 필요합니다.',
    };
  }

  return {
    ok: false,
    code: 'UNSUPPORTED_CURRENCY',
    message: `Unsupported product currency for Toss: ${INVITATION_PRICING.currency}`,
  };
}

export function buildOrderId(paymentAttemptId: string): string {
  // Toss: 6–64 chars, [A-Za-z0-9-_=]
  const compact = paymentAttemptId.replace(/-/g, '');
  return `gi_${compact}`.slice(0, 64);
}

export function getPaymentOrderName(): string {
  return '초대장 발행';
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
