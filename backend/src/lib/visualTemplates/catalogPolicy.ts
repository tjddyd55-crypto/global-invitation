import { VisualTemplateCatalogStatus } from '@prisma/client';

/** Public catalog row eligibility (DB policy ∩ registry). */
export function isPublicCatalogEligible(input: {
  status: VisualTemplateCatalogStatus | string;
  isVisible: boolean;
  sourceType: string;
  templateKey: string;
  registryHas: (key: string) => boolean;
}): boolean {
  if (input.status !== VisualTemplateCatalogStatus.ACTIVE && input.status !== 'ACTIVE') {
    return false;
  }
  if (!input.isVisible) return false;
  if (input.sourceType === 'CODE' && !input.registryHas(input.templateKey)) {
    return false;
  }
  return true;
}

export function isCreateSelectableStatus(input: {
  status: VisualTemplateCatalogStatus | string;
  isVisible: boolean;
}): { ok: true } | { ok: false; code: string } {
  if (input.status === VisualTemplateCatalogStatus.ARCHIVED || input.status === 'ARCHIVED') {
    return { ok: false, code: 'VISUAL_TEMPLATE_ARCHIVED' };
  }
  if (
    input.status === VisualTemplateCatalogStatus.HIDDEN ||
    input.status === 'HIDDEN' ||
    !input.isVisible
  ) {
    return { ok: false, code: 'VISUAL_TEMPLATE_HIDDEN' };
  }
  if (input.status !== VisualTemplateCatalogStatus.ACTIVE && input.status !== 'ACTIVE') {
    return { ok: false, code: 'VISUAL_TEMPLATE_NOT_ACTIVE' };
  }
  return { ok: true };
}

export function normalizeReorderSortOrders(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}
