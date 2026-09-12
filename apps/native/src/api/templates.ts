import { apiRequest } from '@/src/api/client';
import type { ConceptType } from '@/src/api/invitations';

/** Backend catalog row (public visual-catalog API). */
type VisualCatalogApiItem = {
  templateKey: string;
  concept: string;
  displayName: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
};

export type VisualTemplate = {
  /** Same as templateKey — sent as visualTemplateId on create (backend SSOT). */
  id: string;
  templateKey: string;
  title: string;
  description?: string | null;
  concept: ConceptType;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
};

type VisualCatalogResponse = {
  templates: VisualCatalogApiItem[];
};

export function mapVisualCatalogItem(item: VisualCatalogApiItem): VisualTemplate {
  return {
    id: item.templateKey,
    templateKey: item.templateKey,
    title: item.displayName,
    description: item.description ?? null,
    concept: item.concept as ConceptType,
    thumbnailUrl: item.thumbnailUrl ?? null,
    previewUrl: item.previewUrl ?? null,
  };
}

export async function fetchVisualCatalog(concept: ConceptType): Promise<VisualTemplate[]> {
  const response = await apiRequest<VisualCatalogResponse>(
    `/api/templates/visual-catalog?concept=${concept}&locale=ko-KR`,
    { auth: false },
  );
  return (response.templates ?? []).map(mapVisualCatalogItem);
}
