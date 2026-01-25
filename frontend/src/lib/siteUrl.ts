const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const DEFAULT_DEV_SITE_URL = 'http://localhost:3000';

function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function resolveSiteBaseUrl(): string {
  if (SITE_URL) return SITE_URL;
  if (process.env.NODE_ENV !== 'production') return DEFAULT_DEV_SITE_URL;
  // Production should always set NEXT_PUBLIC_SITE_URL.
  console.warn('[siteUrl] NEXT_PUBLIC_SITE_URL is not set. Falling back to localhost.');
  return DEFAULT_DEV_SITE_URL;
}

export function getSiteBaseUrl(): string {
  return resolveSiteBaseUrl();
}

export function getMetadataBase(): URL | undefined {
  try {
    return new URL(resolveSiteBaseUrl());
  } catch {
    return undefined;
  }
}

export function buildCanonicalUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = normalizePath(path);
  try {
    return new URL(normalized, resolveSiteBaseUrl()).toString();
  } catch {
    return normalized;
  }
}
