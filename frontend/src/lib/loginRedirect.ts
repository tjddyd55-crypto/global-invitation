export const LOGIN_REDIRECT_STORAGE_KEY = 'login_redirect';

/**
 * 상대 경로만 허용해 오픈 리디렉션을 막는다.
 */
export function sanitizeReturnPath(path: string | null | undefined): string {
  if (!path || typeof path !== 'string') return '/';
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  if (trimmed.startsWith('/login')) return '/';
  return trimmed;
}

export function buildLoginHref(pathnameWithOptionalSearch: string): string {
  const base =
    pathnameWithOptionalSearch && pathnameWithOptionalSearch.startsWith('/')
      ? pathnameWithOptionalSearch
      : '/';
  return `/login?redirect=${encodeURIComponent(base)}`;
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
