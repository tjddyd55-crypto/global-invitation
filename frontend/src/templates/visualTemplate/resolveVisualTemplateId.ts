import {
  DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT,
  isVisualTemplateId,
  VISUAL_TEMPLATE_CONCEPT,
  type VisualTemplateConcept,
  type VisualTemplateId,
} from './ids';

type ConceptLike = 'WEDDING' | 'FUNERAL' | 'GENERAL' | string | null | undefined;

function asWeddingOrGeneral(concept: ConceptLike): VisualTemplateConcept | null {
  if (concept === 'WEDDING' || concept === 'GENERAL') return concept;
  return null;
}

/**
 * Read-time resolution only — does not write to DB.
 * FUNERAL has no visual template registry entry.
 */
export function resolveVisualTemplateId(
  data: { visualTemplateId?: unknown; conceptType?: unknown } | null | undefined,
  conceptOverride?: ConceptLike
): VisualTemplateId | null {
  const concept = asWeddingOrGeneral(
    conceptOverride ?? (typeof data?.conceptType === 'string' ? data.conceptType : null)
  );
  if (!concept) return null;

  const raw = data?.visualTemplateId;
  if (isVisualTemplateId(raw) && VISUAL_TEMPLATE_CONCEPT[raw] === concept) {
    return raw;
  }
  return DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT[concept];
}

/**
 * Persist only when allowlisted and concept-compatible. Otherwise omit (no silent wrong save).
 */
export function sanitizeVisualTemplateIdForSave(
  visualTemplateId: unknown,
  conceptType: ConceptLike
): VisualTemplateId | undefined {
  const concept = asWeddingOrGeneral(conceptType);
  if (!concept) return undefined;
  if (!isVisualTemplateId(visualTemplateId)) return undefined;
  if (VISUAL_TEMPLATE_CONCEPT[visualTemplateId] !== concept) return undefined;
  return visualTemplateId;
}
