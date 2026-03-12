import { Router, type Request } from 'express';
import type { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  buildMagicLink,
  clearAuthSessionCookie,
  createToken,
  getAuthUser,
  getMagicLinkExpiry,
  getSessionExpiry,
  isValidEmail,
  normalizeEmail,
  setAuthSessionCookie,
  transferGuestData,
} from '../lib/auth';
import { hashPassword, verifyPassword } from '../lib/password';
import { sendMagicLinkEmail } from '../lib/mailer';

const router = Router();
const MIN_PASSWORD_LENGTH = 8;
const SIGNUP_ROLES: ReadonlySet<'USER' | 'CREATOR'> = new Set(['USER', 'CREATOR']);
const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttemptsByKey = new Map<string, number[]>();

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

function consumeLoginAttempt(key: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recentAttempts = (loginAttemptsByKey.get(key) || []).filter(
    (timestamp) => now - timestamp < LOGIN_WINDOW_MS
  );

  if (recentAttempts.length >= LOGIN_MAX_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0] || now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((LOGIN_WINDOW_MS - (now - oldestAttempt)) / 1000)
    );
    loginAttemptsByKey.set(key, recentAttempts);
    return { limited: true, retryAfterSeconds };
  }

  recentAttempts.push(now);
  loginAttemptsByKey.set(key, recentAttempts);
  return { limited: false, retryAfterSeconds: 0 };
}

function normalizeSignupRole(value: unknown): 'USER' | 'CREATOR' {
  const role = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!role) {
    return 'USER';
  }
  if (!SIGNUP_ROLES.has(role as 'USER' | 'CREATOR')) {
    throw new Error('INVALID_SIGNUP_ROLE');
  }
  return role as 'USER' | 'CREATOR';
}

function normalizeNickname(value: unknown): string | null {
  const nickname = typeof value === 'string' ? value.trim() : '';
  if (!nickname) {
    return null;
  }
  return nickname.slice(0, 40);
}

router.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'INVALID_EMAIL' });
    }
    if (!password) {
      return res.status(400).json({ error: 'PASSWORD_REQUIRED' });
    }

    const normalizedEmail = normalizeEmail(email);
    const loginKey = `${resolveClientIp(req)}:${normalizedEmail}`;
    const rateLimit = consumeLoginAttempt(loginKey);
    if (rateLimit.limited) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json({
        error: 'LOGIN_RATE_LIMITED',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    if (!user.passwordHash) {
      return res.status(400).json({ error: 'PASSWORD_LOGIN_NOT_AVAILABLE' });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    const sessionToken = createToken();
    await prisma.authSession.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: getSessionExpiry(),
      },
    });
    setAuthSessionCookie(res, sessionToken);
    loginAttemptsByKey.delete(loginKey);

    return res.status(200).json({
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'FAILED_TO_LOGIN' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const nickname = normalizeNickname(req.body?.nickname);
    const role = normalizeSignupRole(req.body?.role);
    const guestToken =
      typeof req.body?.guestToken === 'string' && req.body.guestToken.trim()
        ? req.body.guestToken.trim()
        : undefined;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'INVALID_EMAIL' });
    }
    if (!password || password.trim().length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        nickname,
        passwordHash,
        role: role as UserRole,
        isCreator: role === 'CREATOR',
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
      },
    });

    const sessionToken = createToken();
    await prisma.authSession.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: getSessionExpiry(),
      },
    });
    setAuthSessionCookie(res, sessionToken);

    if (guestToken) {
      await transferGuestData(guestToken, user.id);
    }

    return res.status(201).json({
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_SIGNUP_ROLE') {
      return res.status(400).json({ error: 'INVALID_SIGNUP_ROLE' });
    }
    console.error('Error creating signup user:', error);
    return res.status(500).json({ error: 'FAILED_TO_SIGNUP' });
  }
});

router.post('/magic-link', async (req, res) => {
  try {
    const { email, guestToken, draftSlug } = req.body ?? {};

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail },
      update: {},
    });

    const token = createToken();
    const expiresAt = getMagicLinkExpiry();
    const link = buildMagicLink(token, typeof draftSlug === 'string' ? draftSlug : undefined);

    const normalizedGuestToken = typeof guestToken === 'string' ? guestToken.trim() : null;
    await prisma.magicLinkToken.create({
      data: {
        token,
        email: normalizedEmail,
        userId: user.id,
        guestToken: normalizedGuestToken || null,
        draftSlug: typeof draftSlug === 'string' ? draftSlug : null,
        expiresAt,
      },
    });

    let delivered = false;
    try {
      delivered = await sendMagicLinkEmail({ to: normalizedEmail, link });
    } catch (err) {
      console.warn('Failed to send magic link email:', err);
    }

    if (!delivered) {
      console.info(`[auth] Magic link for ${normalizedEmail}: ${link}`);
    }

    const isDev = process.env.NODE_ENV !== 'production';
    res.status(200).json({ success: true, previewLink: !delivered && isDev ? link : undefined });
  } catch (error) {
    console.error('Error creating magic link:', error);
    res.status(500).json({ error: 'Failed to create magic link' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { token, guestToken } = req.body ?? {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const magicToken = await prisma.magicLinkToken.findUnique({
      where: { token },
    });

    if (!magicToken) {
      return res.status(400).json({ error: 'Token not found' });
    }
    if (magicToken.usedAt) {
      return res.status(400).json({ error: 'Token already used' });
    }
    if (magicToken.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    const now = new Date();
    await prisma.magicLinkToken.update({
      where: { id: magicToken.id },
      data: { usedAt: now },
    });

    const sessionToken = createToken();
    const session = await prisma.authSession.create({
      data: {
        token: sessionToken,
        userId: magicToken.userId,
        expiresAt: getSessionExpiry(),
      },
      include: { user: true },
    });
    setAuthSessionCookie(res, sessionToken);

    const mergeGuestToken =
      typeof guestToken === 'string' && guestToken.trim()
        ? guestToken.trim()
        : magicToken.guestToken || undefined;

    if (mergeGuestToken) {
      await prisma.invitation.updateMany({
        where: {
          guestToken: mergeGuestToken,
          userId: null,
        },
        data: {
          ownerType: 'USER',
          ownerId: session.userId,
          userId: session.userId,
          guestToken: null,
        },
      });
    }

    res.status(200).json({
      token: sessionToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        nickname: session.user.nickname,
        role: session.user.role,
      },
      redirectSlug: magicToken.draftSlug || null,
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    res.status(500).json({ error: 'Failed to verify magic link' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(200).json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.replace('Bearer', '').trim()
        : '';

    if (tokenFromHeader) {
      await prisma.authSession
        .update({
          where: { token: tokenFromHeader },
          data: { revokedAt: new Date() },
        })
        .catch(() => undefined);
    }

    clearAuthSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ error: 'FAILED_TO_LOGOUT' });
  }
});

router.post('/transfer-guest', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const guestToken = typeof req.body?.guestToken === 'string' ? req.body.guestToken.trim() : '';
    if (!guestToken) {
      return res.status(400).json({ error: 'guestToken is required' });
    }

    const transferredCount = await transferGuestData(guestToken, user.id);
    res.status(200).json({ transferredCount });
  } catch (error) {
    console.error('Error transferring guest data:', error);
    res.status(500).json({ error: 'Failed to transfer guest data' });
  }
});

export default router;
