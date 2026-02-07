const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const DEFAULT_DEV_SITE_URL = 'http://localhost:3000';

function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function resolveSiteBaseUrl(): string {
  if (SITE_URL) return SITE_URL;
  if (process.env.NODE_ENV !== 'production') return DEFAULT_DEV_SITE_URL;
  // Production: no localhost fallback. Empty => relative URLs only.
  return '';
}

export function getSiteBaseUrl(): string {
  return resolveSiteBaseUrl();
}

/** Never throws. Returns undefined when base is empty (demo/sample safe). */
export function getMetadataBase(): URL | undefined {
  const base = resolveSiteBaseUrl();
  if (!base) return undefined;
  try {
    return new URL(base);
  } catch {
    return undefined;
  }
}

/** Never throws. When base is empty returns relative path (demo/sample safe). */
export function buildCanonicalUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = normalizePath(path);
  const base = resolveSiteBaseUrl();
  if (!base) return normalized;
  try {
    return new URL(normalized, base).toString();
  } catch {
    return normalized;
  }
}
