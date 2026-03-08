import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const ADMIN_SESSION_COOKIE = 'gi_admin_session';
const ADMIN_SESSION_TTL_HOURS = 12;

export type AdminSession = {
  adminId: string;
  issuedAt: number;
  expiresAt: number;
};

type AdminCredentials = {
  id: string;
  password: string;
  secret: string;
};

function getAdminCredentials(): AdminCredentials | null {
  const id = process.env.ADMIN_ID?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = (process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '').trim();

  if (!id || !password || !secret) {
    return null;
  }

  return { id, password, secret };
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookieValue(req: Request, cookieName: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(cookieName.length + 1));
}

function buildSession(adminId: string): AdminSession {
  const now = Date.now();
  return {
    adminId,
    issuedAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000,
  };
}

function serializeSession(session: AdminSession, secret: string): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(session));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function deserializeSession(token: string, secret: string): AdminSession | null {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, secret);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<AdminSession>;
    if (
      !session.adminId ||
      typeof session.issuedAt !== 'number' ||
      typeof session.expiresAt !== 'number'
    ) {
      return null;
    }
    if (session.expiresAt < Date.now()) {
      return null;
    }
    return {
      adminId: session.adminId,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminCredentials());
}

export function validateAdminCredentials(adminId: string, password: string): boolean {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return false;
  }

  return safeEqual(adminId.trim(), credentials.id) && safeEqual(password.trim(), credentials.password);
}

export function setAdminSessionCookie(res: Response, adminId: string) {
  const credentials = getAdminCredentials();
  if (!credentials) {
    throw new Error('Admin credentials are not configured.');
  }

  const token = serializeSession(buildSession(adminId), credentials.secret);
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'none' : 'lax';
  res.cookie(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite,
    secure: isProduction,
    maxAge: ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAdminSessionCookie(res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'none' : 'lax';
  res.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    sameSite,
    secure: isProduction,
    path: '/',
  });
}

export function getAdminSession(req: Request): AdminSession | null {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return null;
  }

  const token = parseCookieValue(req, ADMIN_SESSION_COOKIE);
  if (!token) {
    return null;
  }

  return deserializeSession(token, credentials.secret);
}

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: 'ADMIN_UNAUTHORIZED' });
  }

  res.locals.adminSession = session;
  return next();
}
