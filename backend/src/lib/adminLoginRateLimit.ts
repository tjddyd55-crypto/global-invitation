import { createHash } from 'node:crypto';
import { resolveRuntimeAppEnvironment } from './ops/systemConfig';

export type AdminLoginRateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
};

export type AdminLoginRateLimitState = {
  limited: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
};

const loginAttemptsByKey = new Map<string, number[]>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveAdminLoginRateLimitConfig(): AdminLoginRateLimitConfig {
  const maxFromEnv = process.env.ADMIN_LOGIN_RATE_LIMIT_MAX?.trim();
  const windowFromEnv = process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_SEC?.trim();

  if (maxFromEnv || windowFromEnv) {
    return {
      maxAttempts: parsePositiveInt(maxFromEnv, 5),
      windowMs: parsePositiveInt(windowFromEnv, 60) * 1000,
    };
  }

  const runtime = resolveRuntimeAppEnvironment();
  if (runtime === 'development') {
    return { maxAttempts: 10, windowMs: 5 * 60 * 1000 };
  }

  return { maxAttempts: 5, windowMs: 60 * 1000 };
}

export function buildAdminLoginRateLimitKey(ip: string, adminId: string): string {
  const normalizedIp = ip.trim() || 'unknown';
  const normalizedAdminId = adminId.trim().toLowerCase() || 'unknown';
  const digest = createHash('sha256')
    .update(`${normalizedIp}:${normalizedAdminId}`)
    .digest('hex')
    .slice(0, 24);
  return `admin-login:${digest}`;
}

function pruneAttempts(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

export function checkAdminLoginRateLimit(
  key: string,
  config: AdminLoginRateLimitConfig = resolveAdminLoginRateLimitConfig()
): AdminLoginRateLimitState {
  const now = Date.now();
  const recentAttempts = pruneAttempts(loginAttemptsByKey.get(key) || [], config.windowMs, now);

  if (recentAttempts.length >= config.maxAttempts) {
    const oldestAttempt = recentAttempts[0] || now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((config.windowMs - (now - oldestAttempt)) / 1000)
    );
    loginAttemptsByKey.set(key, recentAttempts);
    return {
      limited: true,
      retryAfterSeconds,
      remainingAttempts: 0,
    };
  }

  loginAttemptsByKey.set(key, recentAttempts);
  return {
    limited: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, config.maxAttempts - recentAttempts.length),
  };
}

export function recordAdminLoginFailure(
  key: string,
  config: AdminLoginRateLimitConfig = resolveAdminLoginRateLimitConfig()
): AdminLoginRateLimitState {
  const now = Date.now();
  const recentAttempts = pruneAttempts(loginAttemptsByKey.get(key) || [], config.windowMs, now);
  recentAttempts.push(now);
  loginAttemptsByKey.set(key, recentAttempts);

  if (recentAttempts.length >= config.maxAttempts) {
    const oldestAttempt = recentAttempts[0] || now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((config.windowMs - (now - oldestAttempt)) / 1000)
    );
    return {
      limited: true,
      retryAfterSeconds,
      remainingAttempts: 0,
    };
  }

  return {
    limited: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, config.maxAttempts - recentAttempts.length),
  };
}

export function clearAdminLoginRateLimit(key: string): void {
  loginAttemptsByKey.delete(key);
}

/** Test-only helper */
export function resetAdminLoginRateLimitStore(): void {
  loginAttemptsByKey.clear();
}

export function maskAdminIdentifier(adminId: string): string {
  const normalized = adminId.trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (normalized.includes('@')) {
    const [local, domain] = normalized.split('@');
    if (!local || !domain) return 'masked';
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***@${domain}`;
  }
  const visible = normalized.slice(0, Math.min(2, normalized.length));
  return `${visible}***`;
}
