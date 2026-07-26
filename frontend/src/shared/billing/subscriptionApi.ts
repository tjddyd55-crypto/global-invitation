'use client';

import { DEFAULT_SUBSCRIPTION, normalizeSubscription, type Subscription, type RawSubscription } from './subscription';
import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';
import { buildAuthHeaders } from '@/src/lib/auth';

/**
 * Billing subscription API.
 * Backend `/api/billing/subscription` 가 아직 없으므로 기본값을 반환하고 네트워크 호출하지 않는다.
 * (404를 조용히 삼키는 패턴 금지 — 콘솔/네트워크 오염 방지)
 *
 * 엔드포인트가 배포되면 NEXT_PUBLIC_BILLING_ENABLED=true 로 활성화한다.
 */
export async function fetchSubscription(): Promise<Subscription> {
  if (process.env.NEXT_PUBLIC_BILLING_ENABLED !== 'true') {
    return DEFAULT_SUBSCRIPTION;
  }

  const res = await fetch(
    buildApiUrl('/api/billing/subscription'),
    buildRequestInit({
      method: 'GET',
      headers: { ...buildAuthHeaders() },
      cache: 'no-store',
    })
  );
  if (!res.ok) {
    throw new Error(`SUBSCRIPTION_HTTP_${res.status}`);
  }
  const payload = (await res.json()) as RawSubscription | null;
  return normalizeSubscription(payload);
}
