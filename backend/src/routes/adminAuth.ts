import { Router, type Request } from 'express';
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

const router = Router();
const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttemptsByIp = new Map<string, number[]>();

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

function consumeLoginAttempt(ip: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recentAttempts = (loginAttemptsByIp.get(ip) || []).filter(
    (timestamp) => now - timestamp < LOGIN_WINDOW_MS
  );

  if (recentAttempts.length >= LOGIN_MAX_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0] || now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((LOGIN_WINDOW_MS - (now - oldestAttempt)) / 1000)
    );
    loginAttemptsByIp.set(ip, recentAttempts);
    return { limited: true, retryAfterSeconds };
  }

  recentAttempts.push(now);
  loginAttemptsByIp.set(ip, recentAttempts);
  return { limited: false, retryAfterSeconds: 0 };
}

router.post('/login', async (req, res) => {
  try {
    const ip = resolveClientIp(req);
    const rateLimit = consumeLoginAttempt(ip);
    if (rateLimit.limited) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }

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
    console.log('admin login attempt', adminEmail.trim());

    const normalizedInputId = normalizeAdminId(adminEmail);
    const superEmailRaw = process.env.SUPER_ADMIN_EMAIL?.trim() || '';

    if (superEmailRaw && validateSuperAdminCredentials(adminEmail, password)) {
      setAdminSessionCookie(res, superEmailRaw, 'SUPER_ADMIN');
      console.log('super admin login success');
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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const expectedAdminId = getResolvedAdminId();
    const expectedPassword = getResolvedAdminPassword();
    const acceptedAdminIds = buildAcceptedAdminIds(expectedAdminId);

    if (!acceptedAdminIds.has(normalizedInputId) || password.trim() !== expectedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    setAdminSessionCookie(res, expectedAdminId, 'ADMIN');
    console.log('admin login success');
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
    return res.status(500).json({ error: 'FAILED_TO_LOGIN_ADMIN' });
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

  console.log('admin session verified');
  return res.status(200).json({
    role: session.role,
    email: session.email,
  });
});

export default router;
