import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_SESSION_TTL_HOURS = 24;
const DEV_DEFAULT_ADMIN_ID = 'admin@naver.com';
const DEV_DEFAULT_ADMIN_PASSWORD = 'admin!2345';

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export type AdminSession = {
  role: AdminRole;
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

function isRailwayRuntime(): boolean {
  return Boolean(
    process.env.RAILWAY_ENVIRONMENT_NAME?.trim() ||
      process.env.RAILWAY_PROJECT_ID?.trim() ||
      process.env.RAILWAY_SERVICE_ID?.trim()
  );
}

/**
 * Cross-origin admin UI (Railway FE → Railway API) requires SameSite=None; Secure.
 * Local HTTP (no Railway) keeps Lax + non-secure so admin login still works on localhost.
 *
 * Never set `domain`: host-only cookie on the API host so credentialed fetches send it.
 */
export function resolveAdminSessionCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'none' | 'lax';
  maxAge: number;
  path: '/';
} {
  const maxAge = ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000;
  const isLocalHttp = !isRailwayRuntime() && !isProduction();
  if (isLocalHttp) {
    return {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge,
      path: '/',
    };
  }
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge,
    path: '/',
  };
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

function normalizeAdminId(value: string): string {
  return value.trim().toLowerCase();
}

function resolveSuperAdminEmail(): string {
  return process.env.SUPER_ADMIN_EMAIL?.trim() || '';
}

function resolveSuperAdminPassword(): string {
  return process.env.SUPER_ADMIN_PASSWORD?.trim() || '';
}

export function isSuperAdminConfigured(): boolean {
  const email = resolveSuperAdminEmail();
  const password = resolveSuperAdminPassword();
  const secret = resolveAdminJwtSecret();
  return Boolean(email && password && secret);
}

export function validateSuperAdminCredentials(adminId: string, password: string): boolean {
  const email = resolveSuperAdminEmail();
  const expectedPassword = resolveSuperAdminPassword();
  if (!email || !expectedPassword) {
    return false;
  }
  return normalizeAdminId(adminId) === normalizeAdminId(email) && safeEqual(password.trim(), expectedPassword);
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

function buildSession(adminEmail: string, role: AdminRole): AdminSession {
  const now = Date.now();
  return {
    role,
    email: adminEmail,
    adminId: adminEmail,
    issuedAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000,
  };
}

function buildJwtPayload(session: AdminSession): {
  role: AdminRole;
  email: string;
  iat: number;
  exp: number;
} {
  const iat = Math.floor(session.issuedAt / 1000);
  const exp = Math.floor(session.expiresAt / 1000);
  return {
    role: session.role,
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
    const role: AdminRole = payload.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    if (!payload.email || typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
      return null;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSeconds) {
      return null;
    }

    const emailNorm = normalizeAdminId(payload.email);

    if (role === 'SUPER_ADMIN') {
      const superEmail = resolveSuperAdminEmail();
      if (!superEmail || emailNorm !== normalizeAdminId(superEmail)) {
        return null;
      }
      return {
        role: 'SUPER_ADMIN',
        email: payload.email,
        adminId: payload.email,
        issuedAt: payload.iat * 1000,
        expiresAt: payload.exp * 1000,
      };
    }

    const expectedEmail = resolveAdminId();
    if (!expectedEmail || emailNorm !== normalizeAdminId(expectedEmail)) {
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

export function isAnyAdminPortalConfigured(): boolean {
  return isAdminConfigured() || isSuperAdminConfigured();
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

export function setAdminSessionCookie(res: Response, adminEmail: string, role: AdminRole = 'ADMIN') {
  const jwtSecret = resolveAdminJwtSecret();
  if (!jwtSecret) {
    throw new Error('Admin JWT secret is not configured.');
  }

  const token = serializeSessionJwt(buildSession(adminEmail, role), jwtSecret);
  res.cookie(ADMIN_SESSION_COOKIE, token, resolveAdminSessionCookieOptions());
  console.log('Set-Cookie sent');
}

export function clearAdminSessionCookie(res: Response) {
  const { httpOnly, secure, sameSite, path } = resolveAdminSessionCookieOptions();
  res.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly,
    sameSite,
    secure,
    path,
  });
}

export function getAdminSession(req: Request): AdminSession | null {
  const jwtSecret = resolveAdminJwtSecret();
  if (!jwtSecret) {
    return null;
  }

  const token = parseCookieValue(req, ADMIN_SESSION_COOKIE);
  if (!token) {
    return null;
  }

  return deserializeSessionJwt(token, jwtSecret);
}

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  const session = getAdminSession(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    console.log('admin cookie diagnostics', {
      hasAdminSession: Boolean(parseCookieValue(req, ADMIN_SESSION_COOKIE)),
    });
    return res.status(401).json({ error: 'ADMIN_AUTH_REQUIRED' });
  }

  res.locals.adminSession = session;
  return next();
}

export function requireSuperAdminSession(req: Request, res: Response, next: NextFunction) {
  const session = getAdminSession(req);
  if (!session) {
    console.log('admin cookie diagnostics', {
      hasAdminSession: Boolean(parseCookieValue(req, ADMIN_SESSION_COOKIE)),
    });
    return res.status(401).json({ error: 'ADMIN_AUTH_REQUIRED' });
  }
  if (session.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
  }
  res.locals.adminSession = session;
  return next();
}

export function getResolvedAdminId(): string {
  return resolveAdminId();
}

export function getResolvedAdminPassword(): string {
  return resolveAdminPassword();
}
