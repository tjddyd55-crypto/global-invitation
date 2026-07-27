import { redirect } from 'next/navigation';

/**
 * Compat: legacy `/templates` → canonical `/create/concept`.
 * Same Figma Concept Selection UI (no separate legacy FULL engine page).
 *
 * Middleware also redirects this path (HTTP Location). This page is a
 * belt-and-suspenders fallback if middleware is skipped.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TemplatesCompatRedirectPage() {
  redirect('/create/concept');
}
