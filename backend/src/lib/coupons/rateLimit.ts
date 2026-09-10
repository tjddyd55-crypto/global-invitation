import {
  buildAuthRateLimitKey,
  checkAuthRateLimit,
  recordAuthRateLimitFailure,
  type AuthRateLimitConfig,
} from '../authRateLimit';
import { resolveRuntimeAppEnvironment } from '../ops/systemConfig';

export function resolveCouponValidateRateLimitConfig(): AuthRateLimitConfig {
  const runtime = resolveRuntimeAppEnvironment();
  if (runtime === 'development') {
    return { maxAttempts: 20, windowMs: 5 * 60 * 1000 };
  }
  return { maxAttempts: 8, windowMs: 5 * 60 * 1000 };
}

export function buildCouponValidateRateLimitKey(
  ip: string,
  userKey: string,
  invitationId: string
): string {
  return buildAuthRateLimitKey('coupon-validate', `${ip}|${userKey}`, invitationId);
}

function consumeOne(key: string): { limited: boolean; retryAfterSeconds: number } {
  const config = resolveCouponValidateRateLimitConfig();
  const current = checkAuthRateLimit(key, config);
  if (current.limited) return current;
  return recordAuthRateLimitFailure(key, config);
}

export function consumeCouponValidateAttempt(
  ip: string,
  userId: string | null,
  invitationId: string
): {
  limited: boolean;
  retryAfterSeconds: number;
} {
  const userKey = userId?.trim() || 'anon';
  const ipLimit = consumeOne(buildCouponValidateRateLimitKey(ip, 'ip', invitationId));
  if (ipLimit.limited) return ipLimit;
  return consumeOne(buildCouponValidateRateLimitKey(ip, userKey, invitationId));
}
