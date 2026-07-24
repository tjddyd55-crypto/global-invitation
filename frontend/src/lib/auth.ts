'use client';

import type { Invitation } from '@/src/models/invitation';
import { buildApiUrl } from '@/src/lib/apiBase';
import { buildAdminApiUrl } from '@/src/lib/adminApi';
const SESSION_STORAGE_KEY = 'auth_session_v1';
const GUEST_TOKEN_KEY = 'guest_token_v1';
const LAST_DRAFT_KEY = 'last_draft_slug_v1';
const AUTH_ME_CACHE_KEY = 'auth_me_cache_v1';
const NAVBAR_USER_CACHE_KEY = 'navbar_user_cache_v1';
const AUTH_ME_CACHE_TTL_MS = 60_000;
const AUTH_ME_CACHE_UNAUTH_TTL_MS = 15_000;
const NAVBAR_USER_CACHE_TTL_MS = 45_000;

export type AuthUser = {
  id: string;
  email: string | null;
  nickname?: string | null;
  role: 'USER' | 'CREATOR' | 'ADMIN';
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type MagicLinkResponse = {
  success: boolean;
  previewLink?: string;
};

type VerifyResponse = {
  token: string;
  user: AuthUser;
  redirectSlug?: string | null;
};

type SignupRole = 'USER' | 'CREATOR';

type SignupResponse = {
  token: string;
  user: AuthUser;
};

type LoginResponse = SignupResponse;

type UserCacheRecord = {
  user: AuthUser | null;
  expiresAt: number;
};

let authMeMemoryCache: UserCacheRecord | null = null;
let navbarMemoryCache: UserCacheRecord | null = null;

function isUserCacheRecord(value: unknown): value is UserCacheRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const target = value as { expiresAt?: unknown; user?: unknown };
  return typeof target.expiresAt === 'number' && 'user' in target;
}

function readCacheRecord(storageKey: string, memoryRecord: UserCacheRecord | null): UserCacheRecord | null {
  const now = Date.now();
  if (memoryRecord && memoryRecord.expiresAt > now) {
    return memoryRecord;
  }

  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!isUserCacheRecord(parsed) || parsed.expiresAt <= now) {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
}

function writeCacheRecord(storageKey: string, record: UserCacheRecord) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(storageKey, JSON.stringify(record));
  }
}

function clearCacheRecord(storageKey: string) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(storageKey);
  }
}

function setAuthMeCache(user: AuthUser | null, ttlMs: number) {
  const record: UserCacheRecord = {
    user,
    expiresAt: Date.now() + ttlMs,
  };
  authMeMemoryCache = record;
  writeCacheRecord(AUTH_ME_CACHE_KEY, record);
}

function setNavbarCache(user: AuthUser | null, ttlMs = NAVBAR_USER_CACHE_TTL_MS) {
  const record: UserCacheRecord = {
    user,
    expiresAt: Date.now() + ttlMs,
  };
  navbarMemoryCache = record;
  writeCacheRecord(NAVBAR_USER_CACHE_KEY, record);
}

function clearAuthCaches() {
  authMeMemoryCache = null;
  navbarMemoryCache = null;
  clearCacheRecord(AUTH_ME_CACHE_KEY);
  clearCacheRecord(NAVBAR_USER_CACHE_KEY);
}

export function getCachedNavbarUserSnapshot(): AuthUser | null | undefined {
  const navbarCached = readCacheRecord(NAVBAR_USER_CACHE_KEY, navbarMemoryCache);
  if (navbarCached) {
    navbarMemoryCache = navbarCached;
    return navbarCached.user;
  }

  const authMeCached = readCacheRecord(AUTH_ME_CACHE_KEY, authMeMemoryCache);
  if (!authMeCached) {
    return undefined;
  }
  authMeMemoryCache = authMeCached;
  return authMeCached.user;
}

export function ensureGuestToken(): string {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem(GUEST_TOKEN_KEY);
  if (existing) return existing;
  const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(GUEST_TOKEN_KEY, token);
  return token;
}

export function getGuestToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(GUEST_TOKEN_KEY);
}

export function setGuestToken(token: string) {
  if (typeof window === 'undefined') return;
  const normalized = typeof token === 'string' ? token.trim() : '';
  if (!normalized) return;
  window.localStorage.setItem(GUEST_TOKEN_KEY, normalized);
}

export function setLastDraftSlug(slug: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_DRAFT_KEY, slug);
}

export function getLastDraftSlug(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LAST_DRAFT_KEY);
}

export function clearLastDraftSlug() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LAST_DRAFT_KEY);
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user?.id) {
      return null;
    }
    return {
      ...parsed,
      user: {
        ...parsed.user,
        role: parsed.user.role || 'USER',
      },
    };
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  setAuthMeCache(session.user, AUTH_ME_CACHE_TTL_MS);
  setNavbarCache(session.user);
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  clearAuthCaches();
}

export function getSessionToken(): string | null {
  const session = getStoredSession();
  return session?.token ?? null;
}

export function buildAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  const token = getSessionToken();
  const guestToken = ensureGuestToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (guestToken) {
    headers['x-guest-token'] = guestToken;
  }
  return headers;
}

export async function requestMagicLink(email: string, draftSlug?: string): Promise<MagicLinkResponse> {
  const guestToken = ensureGuestToken();
  const response = await fetch(buildApiUrl('/api/auth/magic-link'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      guestToken,
      draftSlug,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(errorText);
  }

  return response.json();
}

export async function verifyMagicLink(token: string): Promise<VerifyResponse> {
  const guestToken = getGuestToken();
  const response = await fetch(buildApiUrl('/api/auth/verify'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      guestToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(errorText);
  }

  return response.json();
}

export async function signupWithPassword(input: {
  email: string;
  nickname?: string;
  password: string;
  role?: SignupRole;
}): Promise<SignupResponse> {
  const guestToken = getGuestToken();
  const response = await fetch(buildApiUrl('/api/auth/signup'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      nickname: input.nickname || undefined,
      password: input.password,
      role: input.role || 'USER',
      guestToken: guestToken || undefined,
    }),
  });

  if (!response.ok) {
    let message = '회원가입에 실패했습니다.';
    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.message || payload.error || message;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  return response.json();
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const response = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });

  if (!response.ok) {
    let message = '로그인에 실패했습니다.';
    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.message || payload.error || message;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  return response.json();
}

export async function fetchCurrentUser(options?: { useCache?: boolean }): Promise<AuthUser | null> {
  const useCache = options?.useCache !== false;
  if (useCache) {
    const cached = readCacheRecord(AUTH_ME_CACHE_KEY, authMeMemoryCache);
    if (cached) {
      authMeMemoryCache = cached;
      return cached.user;
    }
  }

  const response = await fetch(buildApiUrl('/api/auth/me'), {
    credentials: 'include',
    headers: {
      ...buildAuthHeaders(),
    },
    cache: 'no-store',
  });

  if (response.status === 401) {
    setAuthMeCache(null, AUTH_ME_CACHE_UNAUTH_TTL_MS);
    return null;
  }

  if (!response.ok) {
    throw new Error('FAILED_TO_FETCH_CURRENT_USER');
  }

  const payload = (await response.json()) as AuthUser;
  const user = {
    id: payload.id,
    email: payload.email,
    nickname: payload.nickname || null,
    role: payload.role || 'USER',
  };
  setAuthMeCache(user, AUTH_ME_CACHE_TTL_MS);
  return user;
}

export async function fetchNavbarUser(options?: { useCache?: boolean }): Promise<AuthUser | null> {
  const useCache = options?.useCache !== false;
  if (useCache) {
    const cached = readCacheRecord(NAVBAR_USER_CACHE_KEY, navbarMemoryCache);
    if (cached) {
      navbarMemoryCache = cached;
      return cached.user;
    }
  }

  const appUser = await fetchCurrentUser({ useCache });
  if (appUser) {
    setNavbarCache(appUser);
    return appUser;
  }

  setNavbarCache(null, AUTH_ME_CACHE_UNAUTH_TTL_MS);
  return null;
}

export async function logoutCurrentSession(): Promise<void> {
  const requests = [
    fetch(buildApiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...buildAuthHeaders(),
      },
    }),
    fetch(buildAdminApiUrl('/api/admin/logout'), {
      method: 'POST',
      credentials: 'include',
    }),
  ];
  await Promise.allSettled(requests);
  clearAuthCaches();
}

type EmailCodeRequestResponse = {
  ok: boolean;
  previewCode?: string;
  error?: string;
  retryAfterSeconds?: number;
};

type EmailCodeVerifyResponse = {
  ok: boolean;
  token: string;
  user: AuthUser;
  error?: string;
};

function mapEmailAuthError(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'INVALID_EMAIL':
      return '올바른 이메일 주소를 입력해 주세요.';
    case 'RESEND_COOLDOWN':
      return '잠시 후 다시 요청해 주세요.';
    case 'REQUEST_RATE_LIMITED':
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    case 'INVALID_CODE':
      return '인증번호가 올바르지 않습니다.';
    case 'CODE_EXPIRED':
      return '인증번호가 만료되었습니다. 다시 받아 주세요.';
    case 'CODE_LOCKED':
      return '인증 실패 횟수를 초과했습니다. 새 인증번호를 받아 주세요.';
    case 'CODE_NOT_FOUND':
      return '유효한 인증번호가 없습니다. 다시 받아 주세요.';
    default:
      return fallback;
  }
}

export async function requestEmailVerificationCode(email: string): Promise<EmailCodeRequestResponse> {
  const response = await fetch(buildApiUrl('/api/auth/email/request-code'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const payload = (await response.json().catch(() => ({}))) as EmailCodeRequestResponse;
  if (!response.ok || !payload.ok) {
    throw new Error(mapEmailAuthError(payload.error, '인증번호 발송에 실패했습니다.'));
  }
  return payload;
}

export async function verifyEmailVerificationCode(input: {
  email: string;
  code: string;
}): Promise<EmailCodeVerifyResponse> {
  const response = await fetch(buildApiUrl('/api/auth/email/verify-code'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      code: input.code,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as EmailCodeVerifyResponse & {
    user?: AuthUser;
    token?: string;
  };

  if (!response.ok || !payload.ok || !payload.token || !payload.user?.id) {
    throw new Error(mapEmailAuthError(payload.error, '인증번호 확인에 실패했습니다.'));
  }

  const sessionUser: AuthUser = {
    id: payload.user.id,
    email: payload.user.email,
    nickname: payload.user.nickname || null,
    role: payload.user.role || 'USER',
  };

  setStoredSession({
    token: payload.token,
    user: sessionUser,
  });

  return {
    ok: true,
    token: payload.token,
    user: sessionUser,
  };
}

export function isOwner(invitation: Invitation | null): boolean {
  return Boolean(invitation?.isOwner);
}
