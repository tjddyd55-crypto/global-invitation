/**
 * Internal/Dev mode: show Internal menu and integrity page.
 * Controlled by env only. No auth.
 */
export const isInternalMode =
  typeof process !== 'undefined' &&
  (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_INTERNAL_MODE === 'true');
