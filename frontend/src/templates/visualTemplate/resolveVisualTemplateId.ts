import {
  DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT,
  isVisualTemplateId,
  VISUAL_TEMPLATE_CONCEPT,
  type VisualTemplateConcept,
  type VisualTemplateId,
} from './ids';

type ConceptLike = 'WEDDING' | 'FUNERAL' | 'GENERAL' | 'ORGANIZATION' | string | null | undefined;

function asVisualTemplateConcept(concept: ConceptLike): VisualTemplateConcept | null {
  if (concept === 'WEDDING' || concept === 'GENERAL' || concept === 'ORGANIZATION') return concept;
  return null;
}

/**
 * Read-time CODE resolution only.
 * Unknown / FIGMA catalog keys return null (do not silently map to CODE default).
 * Callers that need a CODE fallback for legacy data without visualTemplateId
 * should use resolveVisualTemplateIdOrDefault.
 */
export function resolveVisualTemplateId(
  data: { visualTemplateId?: unknown; conceptType?: unknown } | null | undefined,
  conceptOverride?: ConceptLike
): VisualTemplateId | null {
  const concept = asVisualTemplateConcept(
    conceptOverride ?? (typeof data?.conceptType === 'string' ? data.conceptType : null)
  );
  if (!concept) return null;

  const raw = data?.visualTemplateId;
  if (isVisualTemplateId(raw)) {
    if (VISUAL_TEMPLATE_CONCEPT[raw] === concept) return raw;
    // Wrong CODE skin for concept → legacy default (not FIGMA)
    return DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT[concept];
  }
  // Explicit non-CODE catalog key (FIGMA / future) → do not CODE-fallback
  if (typeof raw === 'string' && raw.trim()) {
    return null;
  }
  return DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT[concept];
}

export function resolveVisualTemplateIdOrDefault(
  data: { visualTemplateId?: unknown; conceptType?: unknown } | null | undefined,
  conceptOverride?: ConceptLike
): VisualTemplateId | null {
  const concept = asVisualTemplateConcept(
    conceptOverride ?? (typeof data?.conceptType === 'string' ? data.conceptType : null)
  );
  if (!concept) return null;
  const resolved = resolveVisualTemplateId(data, concept);
  return resolved ?? DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT[concept];
}

/**
 * Persist allowlisted CODE ids, or catalog FIGMA keys matching CONCEPT_ prefix.
 */
export function sanitizeVisualTemplateIdForSave(
  visualTemplateId: unknown,
  conceptType: ConceptLike
): string | undefined {
  const concept = asVisualTemplateConcept(conceptType);
  if (!concept) return undefined;
  if (typeof visualTemplateId !== 'string' || !visualTemplateId.trim()) return undefined;
  const id = visualTemplateId.trim();
  if (isVisualTemplateId(id)) {
    if (VISUAL_TEMPLATE_CONCEPT[id] !== concept) return undefined;
    return id;
  }
  const prefix = `${concept}_`;
  if (id.startsWith(prefix) && /^[A-Z0-9_]+$/.test(id)) {
    return id;
  }
  return undefined;
}
