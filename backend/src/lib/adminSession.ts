import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_SESSION_TTL_HOURS = 24;
const DEV_DEFAULT_ADMIN_ID = 'admin@naver.com';
const DEV_DEFAULT_ADMIN_PASSWORD = 'admin!2345';

export type AdminSession = {
  role: 'ADMIN';
  email: string;
  adminId: string;
  issuedAt: number;
  expiresAt: number;
};

type AdminCredentials = {
  email: string;
  password: string;
  jwtSecret: string;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function resolveAdminId(): string {
  const configured = process.env.ADMIN_ID?.trim();
  if (configured) {
    return configured;
  }
  return isProduction() ? '' : DEV_DEFAULT_ADMIN_ID;
}

function resolveAdminPassword(): string {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) {
    return configured;
  }
  return isProduction() ? '' : DEV_DEFAULT_ADMIN_PASSWORD;
}

function resolveAdminJwtSecret(): string {
  return (
    process.env.ADMIN_JWT_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    ''
  );
}

function getAdminCredentials(): AdminCredentials | null {
  const email = resolveAdminId();
  const password = resolveAdminPassword();
  const jwtSecret = resolveAdminJwtSecret();

  if (!email || !password || !jwtSecret) {
    return null;
  }

  return { email, password, jwtSecret };
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

function buildSession(adminEmail: string): AdminSession {
  const now = Date.now();
  return {
    role: 'ADMIN',
    email: adminEmail,
    adminId: adminEmail,
    issuedAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000,
  };
}

function buildJwtPayload(session: AdminSession): {
  role: 'ADMIN';
  email: string;
  iat: number;
  exp: number;
} {
  const iat = Math.floor(session.issuedAt / 1000);
  const exp = Math.floor(session.expiresAt / 1000);
  return {
    role: 'ADMIN',
    email: session.email,
    iat,
    exp,
  };
}

function serializeSessionJwt(session: AdminSession, secret: string): string {
  const encodedHeader = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64UrlEncode(JSON.stringify(buildJwtPayload(session)));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(unsigned, secret);
  return `${unsigned}.${signature}`;
}

function deserializeSessionJwt(token: string, secret: string): AdminSession | null {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsigned, secret);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<{
      role: string;
      email: string;
      iat: number;
      exp: number;
    }>;
    if (
      payload.role !== 'ADMIN' ||
      !payload.email ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSeconds) {
      return null;
    }

    const expectedEmail = resolveAdminId();
    if (!expectedEmail || payload.email.trim() !== expectedEmail.trim()) {
      return null;
    }

    return {
      role: 'ADMIN',
      email: payload.email,
      adminId: payload.email,
      issuedAt: payload.iat * 1000,
      expiresAt: payload.exp * 1000,
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

  return (
    safeEqual(adminId.trim(), credentials.email) &&
    safeEqual(password.trim(), credentials.password)
  );
}

export function setAdminSessionCookie(res: Response, adminEmail: string) {
  const credentials = getAdminCredentials();
  if (!credentials) {
    throw new Error('Admin credentials are not configured.');
  }

  const token = serializeSessionJwt(buildSession(adminEmail), credentials.jwtSecret);
  const secure = isProduction();
  res.cookie(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAdminSessionCookie(res: Response) {
  const secure = isProduction();
  res.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
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

  return deserializeSessionJwt(token, credentials.jwtSecret);
}

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: 'ADMIN_AUTH_REQUIRED' });
  }

  console.log('admin session verified', session.email);
  res.locals.adminSession = session;
  return next();
}

export function getResolvedAdminId(): string {
  return resolveAdminId();
}

export function getResolvedAdminPassword(): string {
  return resolveAdminPassword();
}
