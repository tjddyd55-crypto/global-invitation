import { createHash } from 'node:crypto';
import { resolveRuntimeAppEnvironment } from './ops/systemConfig';

export type AuthRateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
};

export type AuthRateLimitState = {
  limited: boolean;
  retryAfterSeconds: number;
};

const attemptsByKey = new Map<string, number[]>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function pruneAttempts(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

export function resolveLoginRateLimitConfig(): AuthRateLimitConfig {
  const runtime = resolveRuntimeAppEnvironment();
  if (runtime === 'development') {
    return { maxAttempts: 10, windowMs: 5 * 60 * 1000 };
  }
  return { maxAttempts: 8, windowMs: 5 * 60 * 1000 };
}

export function resolveRecoveryRateLimitConfig(): AuthRateLimitConfig {
  const runtime = resolveRuntimeAppEnvironment();
  if (runtime === 'development') {
    return { maxAttempts: 15, windowMs: 5 * 60 * 1000 };
  }
  return { maxAttempts: 8, windowMs: 5 * 60 * 1000 };
}

export function buildAuthRateLimitKey(scope: string, ip: string, identifier: string): string {
  const digest = createHash('sha256')
    .update(`${ip.trim() || 'unknown'}:${identifier.trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 24);
  return `${scope}:${digest}`;
}

export function checkAuthRateLimit(
  key: string,
  config: AuthRateLimitConfig
): AuthRateLimitState {
  const now = Date.now();
  const recentAttempts = pruneAttempts(attemptsByKey.get(key) || [], config.windowMs, now);

  if (recentAttempts.length >= config.maxAttempts) {
    const oldestAttempt = recentAttempts[0] || now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((config.windowMs - (now - oldestAttempt)) / 1000)
    );
    attemptsByKey.set(key, recentAttempts);
    return { limited: true, retryAfterSeconds };
  }

  attemptsByKey.set(key, recentAttempts);
  return { limited: false, retryAfterSeconds: 0 };
}

export function recordAuthRateLimitFailure(
  key: string,
  config: AuthRateLimitConfig
): AuthRateLimitState {
  const now = Date.now();
  const recentAttempts = pruneAttempts(attemptsByKey.get(key) || [], config.windowMs, now);
  recentAttempts.push(now);
  attemptsByKey.set(key, recentAttempts);

  if (recentAttempts.length >= config.maxAttempts) {
    const oldestAttempt = recentAttempts[0] || now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((config.windowMs - (now - oldestAttempt)) / 1000)
    );
    return { limited: true, retryAfterSeconds };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export function clearAuthRateLimit(key: string): void {
  attemptsByKey.delete(key);
}

/** Test-only helper */
export function resetAuthRateLimitStore(): void {
  attemptsByKey.clear();
}
