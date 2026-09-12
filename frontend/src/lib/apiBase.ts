const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  '';

export function normalizeApiBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

/**
 * API Base URL
 * - env가 있으면 해당 URL 사용
 * - 없으면 same-origin "/api" 경로 사용 (rewrite/proxy 전제)
 * - "localhost fallback" 금지
 */
export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(RAW_API_BASE_URL);
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

/** auth.ts 의 `guest_token_v1` 과 동일 키 — RSC 등에서 guestToken 모듈을 쓰지 않을 때용 */
const GUEST_TOKEN_LS_KEY = 'guest_token_v1';

function browserGuestTokenForApi(): string {
  if (typeof window === 'undefined') return '';
  let t = window.localStorage.getItem(GUEST_TOKEN_LS_KEY);
  if (!t) {
    t =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(GUEST_TOKEN_LS_KEY, t);
  }
  return t;
}

function flattenHeaders(init?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!init) return out;
  if (init instanceof Headers) {
    init.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(init)) {
    for (const [k, v] of init) {
      out[k] = v;
    }
    return out;
  }
  Object.assign(out, init as Record<string, string>);
  return out;
}

/**
 * 브라우저에서 공용 API fetch 옵션: credentials + x-guest-token
 * (apiBase는 RSC에서도 import 가능하므로 guestToken.ts 에 의존하지 않음)
 */
export function buildRequestInit(init: RequestInit = {}): RequestInit {
  const headers = flattenHeaders(init.headers);
  const token = browserGuestTokenForApi();
  if (token) {
    headers['x-guest-token'] = token;
  }
  return {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  };
}
