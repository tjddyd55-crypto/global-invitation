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

export function buildCouponValidateRateLimitKey(ip: string, invitationId: string): string {
  return buildAuthRateLimitKey('coupon-validate', ip, invitationId);
}

export function consumeCouponValidateAttempt(ip: string, invitationId: string): {
  limited: boolean;
  retryAfterSeconds: number;
} {
  const config = resolveCouponValidateRateLimitConfig();
  const key = buildCouponValidateRateLimitKey(ip, invitationId);
  const current = checkAuthRateLimit(key, config);
  if (current.limited) return current;
  return recordAuthRateLimitFailure(key, config);
}
