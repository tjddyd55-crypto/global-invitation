import { resolveTossRuntimeKeys, getTossSecretKey } from './provider';

const TOSS_API_BASE = 'https://api.tosspayments.com';

export type TossPaymentObject = {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  currency: string;
  method?: string | null;
  approvedAt?: string | null;
  lastTransactionKey?: string | null;
};

function buildBasicAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`, 'utf8').toString('base64')}`;
}

async function resolveSecretKey(): Promise<string> {
  const keys = await resolveTossRuntimeKeys();
  if (keys.ok) return keys.secretKey;
  return getTossSecretKey();
}

async function tossFetch<T>(
  path: string,
  init: {
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    idempotencyKey?: string;
  }
): Promise<{ ok: true; data: T } | { ok: false; status: number; code?: string; message: string }> {
  let secretKey: string;
  try {
    secretKey = await resolveSecretKey();
  } catch (error) {
    return {
      ok: false,
      status: 503,
      code: 'FOREIGN_MID_NOT_CONFIGURED',
      message: error instanceof Error ? error.message : 'Toss secret not configured',
    };
  }

  const headers: Record<string, string> = {
    Authorization: buildBasicAuthHeader(secretKey),
    'Content-Type': 'application/json',
  };
  if (init.idempotencyKey) {
    headers['Idempotency-Key'] = init.idempotencyKey;
  }

  const response = await fetch(`${TOSS_API_BASE}${path}`, {
    method: init.method,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await response.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = {};
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      code: typeof json.code === 'string' ? json.code : undefined,
      message: typeof json.message === 'string' ? json.message : `Toss API ${response.status}`,
    };
  }

  return { ok: true, data: json as T };
}

export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
  idempotencyKey: string;
}): Promise<{ ok: true; payment: TossPaymentObject } | { ok: false; code: string; message: string }> {
  const result = await tossFetch<TossPaymentObject>('/v1/payments/confirm', {
    method: 'POST',
    idempotencyKey: input.idempotencyKey,
    body: {
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount,
    },
  });

  if (!result.ok) {
    console.error('[payments] toss confirm failed', {
      status: result.status,
      code: result.code,
      orderId: input.orderId,
    });
    return { ok: false, code: result.code || 'TOSS_CONFIRM_FAILED', message: result.message };
  }

  return { ok: true, payment: result.data };
}

export async function getTossPaymentByKey(
  paymentKey: string
): Promise<{ ok: true; payment: TossPaymentObject } | { ok: false; code: string; message: string }> {
  const result = await tossFetch<TossPaymentObject>(`/v1/payments/${encodeURIComponent(paymentKey)}`, {
    method: 'GET',
  });
  if (!result.ok) {
    return { ok: false, code: result.code || 'TOSS_QUERY_FAILED', message: result.message };
  }
  return { ok: true, payment: result.data };
}

/** Non-charge credential probe — auth check without creating a charge. */
export async function probeTossCredentials(secretKey: string): Promise<{
  ok: boolean;
  code: string;
  message: string;
}> {
  try {
    const response = await fetch(`${TOSS_API_BASE}/v1/payments/gi_connection_probe_invalid`, {
      method: 'GET',
      headers: {
        Authorization: buildBasicAuthHeader(secretKey),
      },
    });
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: 'TOSS_AUTH_FAILED',
        message: 'Toss rejected the secret key (unauthorized).',
      };
    }
    return {
      ok: true,
      code: 'CREDENTIALS_ACCEPTED',
      message:
        'Credentials appear valid for Toss API auth. USD foreign MID / overseas card contract must still be confirmed in Toss console.',
    };
  } catch (error) {
    return {
      ok: false,
      code: 'TOSS_CONNECTION_FAILED',
      message: error instanceof Error ? error.message : 'Toss connection failed',
    };
  }
}
