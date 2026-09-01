import { Router, type Request, type Response } from 'express';
import {
  clearAdminSessionCookie,
  getAdminSession,
  getResolvedAdminId,
  getResolvedAdminPassword,
  isAdminConfigured,
  isAnyAdminPortalConfigured,
  requireAdminSession,
  setAdminSessionCookie,
  validateSuperAdminCredentials,
} from '../lib/adminSession';
import { logAdminAction } from '../admin/adminAuditLog';
import {
  buildAdminLoginRateLimitKey,
  checkAdminLoginRateLimit,
  clearAdminLoginRateLimit,
  maskAdminIdentifier,
  recordAdminLoginFailure,
} from '../lib/adminLoginRateLimit';

const router = Router();

function normalizeAdminId(value: string): string {
  return value.trim().toLowerCase();
}

function resolveAdminIdAliasesFromEnv(): string[] {
  return (process.env.ADMIN_ID_ALIASES || '')
    .split(',')
    .map((value) => normalizeAdminId(value))
    .filter(Boolean);
}

function buildAcceptedAdminIds(expectedAdminId: string): Set<string> {
  const normalizedExpected = normalizeAdminId(expectedAdminId);
  const accepted = new Set<string>([normalizedExpected]);

  // Backward compatibility: allow "admin" <-> "admin@naver.com" transition.
  if (normalizedExpected.includes('@')) {
    const localPart = normalizedExpected.split('@')[0]?.trim();
    if (localPart) {
      accepted.add(localPart);
    }
  } else {
    accepted.add(`${normalizedExpected}@naver.com`);
  }

  resolveAdminIdAliasesFromEnv().forEach((alias) => {
    accepted.add(alias);
  });
  return accepted;
}

function resolveClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function respondInvalidCredentials(
  res: Response,
  ip: string,
  adminId: string,
  rateLimitKey: string
) {
  const failureState = recordAdminLoginFailure(rateLimitKey);
  console.warn('admin login failed', {
    ip,
    adminId: maskAdminIdentifier(adminId),
    rateLimited: failureState.limited,
  });

  if (failureState.limited) {
    res.setHeader('Retry-After', String(failureState.retryAfterSeconds));
    return res.status(429).json({
      error: 'ADMIN_LOGIN_RATE_LIMITED',
      retryAfterSeconds: failureState.retryAfterSeconds,
    });
  }

  return res.status(401).json({ error: 'ADMIN_INVALID_CREDENTIALS' });
}

router.post('/login', async (req, res) => {
  try {
    const ip = resolveClientIp(req);

    if (!isAnyAdminPortalConfigured()) {
      return res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });
    }

    const adminEmail =
      typeof req.body?.email === 'string'
        ? req.body.email
        : typeof req.body?.id === 'string'
          ? req.body.id
          : typeof req.body?.adminId === 'string'
            ? req.body.adminId
            : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!adminEmail.trim() || !password.trim()) {
      return res.status(400).json({ error: 'ADMIN_CREDENTIALS_REQUIRED' });
    }

    const normalizedInputId = normalizeAdminId(adminEmail);
    const rateLimitKey = buildAdminLoginRateLimitKey(ip, normalizedInputId);
    const rateLimit = checkAdminLoginRateLimit(rateLimitKey);
    if (rateLimit.limited) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      console.warn('admin login rate limited', {
        ip,
        adminId: maskAdminIdentifier(adminEmail),
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
      return res.status(429).json({
        error: 'ADMIN_LOGIN_RATE_LIMITED',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const superEmailRaw = process.env.SUPER_ADMIN_EMAIL?.trim() || '';

    if (superEmailRaw && validateSuperAdminCredentials(adminEmail, password)) {
      clearAdminLoginRateLimit(rateLimitKey);
      setAdminSessionCookie(res, superEmailRaw, 'SUPER_ADMIN');
      console.log('admin login success', {
        ip,
        adminId: maskAdminIdentifier(superEmailRaw),
        role: 'SUPER_ADMIN',
      });
      await logAdminAction({
        adminId: superEmailRaw,
        action: 'super_admin_login',
        targetType: 'admin',
        targetId: superEmailRaw,
        payload: {
          ip,
          userAgent: req.headers['user-agent'] || null,
        },
      }).catch((error) => {
        console.warn('Failed to write super admin login audit log:', error);
      });

      return res.status(200).json({
        success: true,
        role: 'SUPER_ADMIN',
        email: superEmailRaw,
      });
    }

    if (!isAdminConfigured()) {
      return respondInvalidCredentials(res, ip, adminEmail, rateLimitKey);
    }

    const expectedAdminId = getResolvedAdminId();
    const expectedPassword = getResolvedAdminPassword();
    const acceptedAdminIds = buildAcceptedAdminIds(expectedAdminId);

    if (!acceptedAdminIds.has(normalizedInputId) || password.trim() !== expectedPassword) {
      return respondInvalidCredentials(res, ip, adminEmail, rateLimitKey);
    }

    clearAdminLoginRateLimit(rateLimitKey);
    setAdminSessionCookie(res, expectedAdminId, 'ADMIN');
    console.log('admin login success', {
      ip,
      adminId: maskAdminIdentifier(expectedAdminId),
      role: 'ADMIN',
    });
    await logAdminAction({
      adminId: expectedAdminId,
      action: 'admin_login',
      targetType: 'admin',
      targetId: expectedAdminId,
      payload: {
        ip,
        userAgent: req.headers['user-agent'] || null,
      },
    }).catch((error) => {
      console.warn('Failed to write admin login audit log:', error);
    });

    return res.status(200).json({
      success: true,
      role: 'ADMIN',
      email: expectedAdminId,
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    return res.status(500).json({ error: 'ADMIN_LOGIN_FAILED' });
  }
});

router.post('/logout', async (_req, res) => {
  clearAdminSessionCookie(res);
  return res.status(200).json({ success: true });
});

router.get('/me', requireAdminSession, async (req, res) => {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: 'ADMIN_AUTH_REQUIRED' });
  }

  return res.status(200).json({
    role: session.role,
    email: session.email,
  });
});

export default router;
