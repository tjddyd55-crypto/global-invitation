'use client';

import type { Invitation } from '@/src/models/invitation';
import { buildApiUrl } from '@/src/lib/apiBase';
const SESSION_STORAGE_KEY = 'auth_session_v1';
const GUEST_TOKEN_KEY = 'guest_token_v1';
const LAST_DRAFT_KEY = 'last_draft_slug_v1';

export type AuthUser = {
  id: string;
  email: string | null;
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
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getSessionToken(): string | null {
  const session = getStoredSession();
  return session?.token ?? null;
}

export function buildAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  const token = getSessionToken();
  const guestToken = getGuestToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (guestToken) {
    headers['X-Guest-Token'] = guestToken;
  }
  return headers;
}

export async function requestMagicLink(email: string, draftSlug?: string): Promise<MagicLinkResponse> {
  const guestToken = ensureGuestToken();
  const response = await fetch(buildApiUrl('/api/auth/magic-link'), {
    method: 'POST',
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

export function isOwner(invitation: Invitation | null): boolean {
  return Boolean(invitation?.isOwner);
}
