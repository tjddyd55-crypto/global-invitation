'use client';

import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';
import { buildAuthHeaders } from '@/src/lib/auth';
import { DEFAULT_SUBSCRIPTION, normalizeSubscription, type Subscription, type RawSubscription } from './subscription';

/**
 * 현재 로그인 사용자의 구독 상태를 가져온다.
 * - 서버에 엔드포인트가 없어도(404/501) 기본값(FREE)으로 안전 폴백한다.
 * - 네트워크 오류는 throw 하지 않는다 — UI 가 구독 때문에 블록되면 안 된다.
 */
export async function fetchSubscription(): Promise<Subscription> {
  try {
    const res = await fetch(
      buildApiUrl('/api/billing/subscription'),
      buildRequestInit({
        method: 'GET',
        headers: { ...buildAuthHeaders() },
        cache: 'no-store',
      }),
    );
    if (!res.ok) return DEFAULT_SUBSCRIPTION;
    const payload = (await res.json()) as RawSubscription | null;
    return normalizeSubscription(payload);
  } catch {
    return DEFAULT_SUBSCRIPTION;
  }
}
