/**
 * 구독 상태(SubscriptionState) 정의와 정규화 로직.
 *
 * 이 모듈은 UI / 라우팅 가드 / 결제 플로우가 공통으로 의존하는
 * "단일 진실 원천(Single Source of Truth)" 이다.
 *
 * - UI 는 `useSubscription()` 로만 상태를 읽는다.
 * - 서버 응답은 반드시 `normalizeSubscription()` 을 통해서만 들어온다.
 * - 상태 판정(만료/체험 남음 등) 은 반드시 이 파일의 함수로만 한다.
 */

export type SubscriptionState = 'FREE' | 'TRIAL' | 'PAID' | 'EXPIRED';

export interface Subscription {
  state: SubscriptionState;
  trialEndsAt: string | null;
  paidUntil: string | null;
  source: 'default' | 'server' | 'override';
}

export const DEFAULT_SUBSCRIPTION: Subscription = {
  state: 'FREE',
  trialEndsAt: null,
  paidUntil: null,
  source: 'default',
};

export interface RawSubscription {
  state?: string | null;
  trial_ends_at?: string | null;
  trialEndsAt?: string | null;
  paid_until?: string | null;
  paidUntil?: string | null;
}

/**
 * 서버가 주는 다양한 표현(snake_case, 대소문자, null, 누락)을 한 벌로 정리한다.
 * - 만료 시각이 지났는데 서버가 상태를 안 바꿨을 경우에도 클라이언트에서 EXPIRED 로 보정한다.
 */
export function normalizeSubscription(
  raw: RawSubscription | null | undefined,
  now: Date = new Date(),
): Subscription {
  if (!raw) return DEFAULT_SUBSCRIPTION;

  const trialEndsAt = pickIso(raw.trialEndsAt, raw.trial_ends_at);
  const paidUntil = pickIso(raw.paidUntil, raw.paid_until);
  const rawState = (raw.state ?? '').toString().trim().toUpperCase();

  let state: SubscriptionState = isSubscriptionState(rawState) ? rawState : 'FREE';
  state = reconcileWithDeadlines(state, { trialEndsAt, paidUntil, now });

  return {
    state,
    trialEndsAt,
    paidUntil,
    source: 'server',
  };
}

export function isActive(sub: Subscription): boolean {
  return sub.state === 'TRIAL' || sub.state === 'PAID';
}

export function isExpired(sub: Subscription): boolean {
  return sub.state === 'EXPIRED';
}

export function daysRemaining(sub: Subscription, now: Date = new Date()): number | null {
  const target = sub.state === 'TRIAL' ? sub.trialEndsAt : sub.paidUntil;
  if (!target) return null;
  const diffMs = new Date(target).getTime() - now.getTime();
  if (Number.isNaN(diffMs)) return null;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** UI 가드: 유료 기능 접근 가능한가 */
export function canAccessPaidAction(sub: Subscription): boolean {
  return isActive(sub);
}

// ---- internals ----

function isSubscriptionState(value: string): value is SubscriptionState {
  return value === 'FREE' || value === 'TRIAL' || value === 'PAID' || value === 'EXPIRED';
}

function pickIso(...candidates: Array<string | null | undefined>): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return null;
}

function reconcileWithDeadlines(
  state: SubscriptionState,
  ctx: { trialEndsAt: string | null; paidUntil: string | null; now: Date },
): SubscriptionState {
  const { trialEndsAt, paidUntil, now } = ctx;

  if (state === 'TRIAL' && trialEndsAt && new Date(trialEndsAt).getTime() < now.getTime()) {
    return paidUntil && new Date(paidUntil).getTime() >= now.getTime() ? 'PAID' : 'EXPIRED';
  }

  if (state === 'PAID' && paidUntil && new Date(paidUntil).getTime() < now.getTime()) {
    return 'EXPIRED';
  }

  return state;
}
