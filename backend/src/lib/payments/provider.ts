import crypto from 'crypto';
import { getInvitationPricingSnapshot } from '../pricing/invitationPricing';

export type PaymentProviderName = 'mock' | 'stripe';

export type CheckoutSessionResult = {
  providerCheckoutId: string;
  checkoutUrl: string;
  clientToken?: string;
};

export type ProviderWebhookResult =
  | { kind: 'ignored' }
  | {
      kind: 'status';
      providerEventId: string;
      eventType: string;
      providerCheckoutId?: string | null;
      providerPaymentId?: string | null;
      status: 'PAID' | 'FAILED' | 'CANCELED' | 'REFUNDED';
      currency?: string | null;
      amountCents?: number | null;
      rawProviderStatus?: string | null;
    };

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

  if (raw === 'stripe') {
    return 'stripe';
  }

  // development default: mock when Stripe keys missing
  if (nodeEnv !== 'production' && !process.env.STRIPE_SECRET_KEY?.trim()) {
    return 'mock';
  }

  if (process.env.STRIPE_SECRET_KEY?.trim()) {
    return 'stripe';
  }

  throw new Error('PAYMENT_PROVIDER is not configured');
}

export function getFrontendBaseUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getBackendBaseUrl(): string {
  return (
    process.env.BACKEND_PUBLIC_URL ||
    process.env.BACKEND_URL ||
    `http://localhost:${process.env.PORT || 3001}`
  ).replace(/\/$/, '');
}

export async function createProviderCheckout(input: {
  provider: PaymentProviderName;
  invitationId: string;
  paymentAttemptId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSessionResult> {
  const snapshot = getInvitationPricingSnapshot();

  if (input.provider === 'mock') {
    const providerCheckoutId = `mock_cs_${input.paymentAttemptId}`;
    const checkoutUrl =
      `${getBackendBaseUrl()}/api/payments/mock/complete` +
      `?checkoutId=${encodeURIComponent(providerCheckoutId)}` +
      `&redirect=${encodeURIComponent(input.successUrl)}`;
    return { providerCheckoutId, checkoutUrl };
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is required for stripe provider');
  }

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', input.successUrl);
  params.set('cancel_url', input.cancelUrl);
  params.set('client_reference_id', input.paymentAttemptId);
  params.set('metadata[invitationId]', input.invitationId);
  params.set('metadata[paymentAttemptId]', input.paymentAttemptId);
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', snapshot.currency.toLowerCase());
  params.set('line_items[0][price_data][unit_amount]', String(snapshot.chargedAmountCents));
  params.set('line_items[0][price_data][product_data][name]', 'Invitation publish');
  params.set('idempotency_key', `${input.invitationId}:${input.paymentAttemptId}`);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `${input.invitationId}:${input.paymentAttemptId}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[payments] stripe checkout create failed', {
      status: response.status,
      invitationId: input.invitationId,
      paymentAttemptId: input.paymentAttemptId,
    });
    throw new Error(`STRIPE_CHECKOUT_FAILED:${response.status}:${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as { id?: string; url?: string };
  if (!data.id || !data.url) {
    throw new Error('STRIPE_CHECKOUT_INVALID_RESPONSE');
  }

  return {
    providerCheckoutId: data.id,
    checkoutUrl: data.url,
  };
}

export function verifyStripeWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) return false;

  // Stripe signature: t=timestamp,v1=signature
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((piece) => {
      const [k, v] = piece.split('=');
      return [k, v];
    })
  ) as Record<string, string>;

  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const digest = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function parseStripeWebhookEvent(rawBody: Buffer): ProviderWebhookResult {
  const payload = JSON.parse(rawBody.toString('utf8')) as {
    id?: string;
    type?: string;
    data?: { object?: Record<string, unknown> };
  };

  const eventId = payload.id;
  const eventType = payload.type || 'unknown';
  if (!eventId) {
    return { kind: 'ignored' };
  }

  const obj = payload.data?.object || {};
  const metadata = (obj.metadata || {}) as Record<string, string>;
  const providerCheckoutId =
    typeof obj.id === 'string' && eventType.startsWith('checkout.session')
      ? obj.id
      : typeof obj.checkout_session === 'string'
        ? obj.checkout_session
        : null;

  if (eventType === 'checkout.session.completed' || eventType === 'checkout.session.async_payment_succeeded') {
    const amountTotal = typeof obj.amount_total === 'number' ? obj.amount_total : null;
    const currency = typeof obj.currency === 'string' ? obj.currency.toUpperCase() : null;
    const paymentIntent =
      typeof obj.payment_intent === 'string'
        ? obj.payment_intent
        : metadata.paymentAttemptId
          ? `pi_${metadata.paymentAttemptId}`
          : null;
    return {
      kind: 'status',
      providerEventId: eventId,
      eventType,
      providerCheckoutId,
      providerPaymentId: paymentIntent,
      status: 'PAID',
      currency,
      amountCents: amountTotal,
      rawProviderStatus: eventType,
    };
  }

  if (eventType === 'checkout.session.expired') {
    return {
      kind: 'status',
      providerEventId: eventId,
      eventType,
      providerCheckoutId,
      status: 'CANCELED',
      rawProviderStatus: eventType,
    };
  }

  if (eventType === 'checkout.session.async_payment_failed') {
    return {
      kind: 'status',
      providerEventId: eventId,
      eventType,
      providerCheckoutId,
      status: 'FAILED',
      rawProviderStatus: eventType,
    };
  }

  if (eventType === 'charge.refunded') {
    return {
      kind: 'status',
      providerEventId: eventId,
      eventType,
      providerPaymentId: typeof obj.payment_intent === 'string' ? obj.payment_intent : null,
      status: 'REFUNDED',
      rawProviderStatus: eventType,
    };
  }

  return { kind: 'ignored' };
}
