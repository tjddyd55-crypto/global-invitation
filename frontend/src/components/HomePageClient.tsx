/**
 * @deprecated LEGACY marketing landing — DO NOT import from app routes.
 * Canonical home: MainScreen / DesktopMainScreen via app/page.tsx.
 * Kept only so git history / assert can detect accidental re-wiring.
 * Safe to delete once assert:no-legacy-ui + e2e stay green for 1 sprint.
 */
'use client';

export default function HomePageClientLegacyArchived() {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[legacy] HomePageClient must not be mounted on canonical routes');
  }
  return null;
}
