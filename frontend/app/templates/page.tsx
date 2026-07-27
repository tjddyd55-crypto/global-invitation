import { redirect } from 'next/navigation';

/**
 * Compat: legacy `/templates` → canonical `/create/concept`.
 * Same Figma Concept Selection UI (no separate legacy FULL engine page).
 */
export default function TemplatesCompatRedirectPage() {
  redirect('/create/concept');
}
