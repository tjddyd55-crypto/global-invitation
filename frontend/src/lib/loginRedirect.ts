import {
  CONCEPT_CREATE_PATH,
  getCreateInvitationEntryPath,
  getMyInvitationsEntryPath,
} from '@/src/shared/auth/authEntryPaths';
import type { AuthStatus } from '@/src/shared/auth/authStatus';

export const LOGIN_REDIRECT_STORAGE_KEY = 'login_redirect';

/**
 * 상대 경로만 허용해 오픈 리디렉션을 막는다.
 */
const AUTH_ROUTE_BLOCKLIST = [
  '/login',
  '/signup',
  '/pc/login',
  '/pc/signup',
  '/m/login',
  '/m/signup',
  '/auth/email',
  '/m/auth/email',
  '/pc/auth/email',
];

export function sanitizeReturnPath(path: string | null | undefined): string {
  if (!path || typeof path !== 'string') return '/';
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(trimmed)) return '/';
  let url: URL;
  let pathname: string;
  try {
    url = new URL(trimmed, 'https://return-path.invalid');
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return '/';
  }
  if (pathname.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(pathname)) return '/';
  if (
    AUTH_ROUTE_BLOCKLIST.some(
      (blocked) =>
        pathname === blocked || pathname.startsWith(`${blocked}/`)
    )
  ) {
    return '/';
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** URLSearchParams values are already decoded. Prefer next when both are present. */
export function getAuthReturnParam(params: { get: (name: string) => string | null }): string | null {
  return params.get('next') || params.get('redirect');
}

export function buildLoginHref(pathnameWithOptionalSearch: string): string {
  const base =
    pathnameWithOptionalSearch && pathnameWithOptionalSearch.startsWith('/')
      ? pathnameWithOptionalSearch
      : '/';
  return `/login?next=${encodeURIComponent(base)}`;
}

/** boolean 호환 래퍼 — 내부는 getCreateInvitationEntryPath SSOT. */
export function buildCreateInvitationHref(isAuthenticated: boolean): string {
  const status: AuthStatus = isAuthenticated ? 'authenticated' : 'unauthenticated';
  return getCreateInvitationEntryPath(status);
}

export { CONCEPT_CREATE_PATH, getCreateInvitationEntryPath, getMyInvitationsEntryPath };

export function resolveLoginRedirectForStorage(
  redirectParam: string | null,
  documentReferrer: string,
  windowOrigin: string
): string {
  if (redirectParam) {
    return sanitizeReturnPath(redirectParam);
  }
  if (documentReferrer) {
    try {
      const url = new URL(documentReferrer);
      if (url.origin === windowOrigin) {
        return sanitizeReturnPath(`${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      // ignore
    }
  }
  return '/';
}

export function consumeStoredLoginRedirect(): string {
  if (typeof window === 'undefined') return '/';
  const raw = sessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
  sessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
  return sanitizeReturnPath(raw);
}
