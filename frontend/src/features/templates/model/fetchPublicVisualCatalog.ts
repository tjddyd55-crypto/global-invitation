/**
 * Public visual catalog — operational policy ∩ CODE registry.
 */
import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';

export type PublicVisualCatalogItem = {
  templateKey: string;
  concept: string;
  displayName: string;
  description: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  featured: boolean;
  new: boolean;
  premium: boolean;
  sortOrder: number;
  activeVersion: number | null;
  sourceType: string;
};

export async function fetchPublicVisualCatalog(input?: {
  concept?: string;
  locale?: string;
}): Promise<PublicVisualCatalogItem[]> {
  const params = new URLSearchParams();
  if (input?.concept) params.set('concept', input.concept);
  if (input?.locale) params.set('locale', input.locale);
  const query = params.toString();
  const response = await fetch(
    buildApiUrl(`/api/templates/visual-catalog${query ? `?${query}` : ''}`),
    buildRequestInit({ method: 'GET' })
  );
  if (!response.ok) {
    throw new Error(`VISUAL_CATALOG_FAILED:${response.status}`);
  }
  const json = (await response.json()) as { templates?: PublicVisualCatalogItem[] };
  return Array.isArray(json.templates) ? json.templates : [];
}
