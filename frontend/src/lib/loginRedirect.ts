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
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  if (AUTH_ROUTE_BLOCKLIST.some((blocked) => trimmed === blocked || trimmed.startsWith(`${blocked}?`) || trimmed.startsWith(`${blocked}/`))) {
    return '/';
  }
  return trimmed;
}

export function buildLoginHref(pathnameWithOptionalSearch: string): string {
  const base =
    pathnameWithOptionalSearch && pathnameWithOptionalSearch.startsWith('/')
      ? pathnameWithOptionalSearch
      : '/';
  return `/auth/email?next=${encodeURIComponent(base)}`;
}

export function buildCreateInvitationHref(isAuthenticated: boolean): string {
  if (isAuthenticated) {
    return '/templates';
  }
  return `/auth/email?next=${encodeURIComponent('/templates')}`;
}

export function resolveLoginRedirectForStorage(
  redirectParam: string | null,
  documentReferrer: string,
  windowOrigin: string
): string {
  if (redirectParam) {
    try {
      const decoded = decodeURIComponent(redirectParam);
      return sanitizeReturnPath(decoded);
    } catch {
      return '/';
    }
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
