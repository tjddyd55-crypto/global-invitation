/**
 * Platform shell SSOT — marketing / auth must not use PcShell sidebar.
 */
export type PlatformShell = 'marketing' | 'auth' | 'app' | 'editor' | 'public' | 'publish';

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  const trimmed = pathname.split('?')[0]?.split('#')[0] || '/';
  if (trimmed.length > 1 && trimmed.endsWith('/')) return trimmed.slice(0, -1);
  return trimmed || '/';
}

export function getPlatformShellForPath(pathname: string): PlatformShell {
  const path = normalizePathname(pathname);

  if (
    path === '/' ||
    path === '/pricing' ||
    path === '/contact' ||
    path === '/create' ||
    path === '/create/concept' ||
    path === '/templates'
  ) {
    return 'marketing';
  }

  if (path === '/auth/email' || path === '/auth/verify' || path.startsWith('/auth/')) {
    return 'auth';
  }

  if (path.startsWith('/editor/') || path === '/editor') {
    return 'editor';
  }

  if (path.startsWith('/i/') || path === '/i') {
    return 'public';
  }

  if (path.startsWith('/publish')) {
    return 'publish';
  }

  return 'app';
}
