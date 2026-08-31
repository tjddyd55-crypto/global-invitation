/**
 * Visual template allowlist — keep in sync with
 * frontend/src/templates/visualTemplate/ids.ts
 */

export const VISUAL_TEMPLATE_IDS = [
  'WEDDING_01_CLASSIC',
  'WEDDING_04_EDITORIAL',
  'WEDDING_05_GARDEN',
  'WEDDING_06_NIGHT',
  'GENERAL_01_CLASSIC',
  'GENERAL_04_CLEAN',
  'GENERAL_05_FESTIVE',
  'GENERAL_06_CULTURE',
  'ORGANIZATION_01_OFFICIAL',
  'ORGANIZATION_02_JCI',
] as const;

export type VisualTemplateId = (typeof VISUAL_TEMPLATE_IDS)[number];

export type VisualTemplateConcept = 'WEDDING' | 'GENERAL' | 'ORGANIZATION';

export const VISUAL_TEMPLATE_CONCEPT: Record<VisualTemplateId, VisualTemplateConcept> = {
  WEDDING_01_CLASSIC: 'WEDDING',
  WEDDING_04_EDITORIAL: 'WEDDING',
  WEDDING_05_GARDEN: 'WEDDING',
  WEDDING_06_NIGHT: 'WEDDING',
  GENERAL_01_CLASSIC: 'GENERAL',
  GENERAL_04_CLEAN: 'GENERAL',
  GENERAL_05_FESTIVE: 'GENERAL',
  GENERAL_06_CULTURE: 'GENERAL',
  ORGANIZATION_01_OFFICIAL: 'ORGANIZATION',
  ORGANIZATION_02_JCI: 'ORGANIZATION',
};

export function isVisualTemplateId(value: unknown): value is VisualTemplateId {
  return typeof value === 'string' && (VISUAL_TEMPLATE_IDS as readonly string[]).includes(value);
}

/**
 * Returns sanitized id to store, or undefined to omit the field.
 * CODE keys use allowlist. FIGMA catalog keys (uppercase_underscore) allowed when concept matches prefix.
 */
export function sanitizeVisualTemplateIdForSave(
  visualTemplateId: unknown,
  conceptType: unknown
): string | undefined {
  if (conceptType !== 'WEDDING' && conceptType !== 'GENERAL' && conceptType !== 'ORGANIZATION') {
    return undefined;
  }
  if (typeof visualTemplateId !== 'string' || !visualTemplateId.trim()) return undefined;
  const id = visualTemplateId.trim();
  if (isVisualTemplateId(id)) {
    if (VISUAL_TEMPLATE_CONCEPT[id] !== conceptType) return undefined;
    return id;
  }
  // FIGMA / future catalog keys: CONCEPT_NN_NAME
  const prefix = `${conceptType}_`;
  if (id.startsWith(prefix) && /^[A-Z0-9_]+$/.test(id)) {
    return id;
  }
  return undefined;
}

/**
 * Strip invalid visualTemplateId from a dataJson object (mutates copy).
 */
export function applyVisualTemplateToDataJson(
  data: Record<string, unknown>,
  conceptType: unknown,
  explicitId?: unknown
): Record<string, unknown> {
  const next = { ...data };
  const candidate = explicitId !== undefined ? explicitId : next.visualTemplateId;
  const sanitized = sanitizeVisualTemplateIdForSave(candidate, conceptType);
  if (sanitized) {
    next.visualTemplateId = sanitized;
  } else {
    delete next.visualTemplateId;
  }
  return next;
}
