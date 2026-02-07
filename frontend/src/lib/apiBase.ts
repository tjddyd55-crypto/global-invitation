const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  '';

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

/**
 * API Base URL
 * - env가 있으면 해당 URL 사용
 * - 없으면 same-origin "/api" 경로 사용 (rewrite/proxy 전제)
 * - "localhost fallback" 금지
 */
export function getApiBaseUrl(): string {
  return normalizeBaseUrl(RAW_API_BASE_URL);
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
