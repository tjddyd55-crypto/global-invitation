/**
 * Visual template ID SSOT — dataJson.visualTemplateId only.
 * Engine templateKey remains invitation_full. No 02/03 placeholders.
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
] as const;

export type VisualTemplateId = (typeof VISUAL_TEMPLATE_IDS)[number];

export type VisualTemplateConcept = 'WEDDING' | 'GENERAL' | 'ORGANIZATION';

export const DEFAULT_VISUAL_TEMPLATE_BY_CONCEPT: Record<VisualTemplateConcept, VisualTemplateId> = {
  WEDDING: 'WEDDING_01_CLASSIC',
  GENERAL: 'GENERAL_01_CLASSIC',
  ORGANIZATION: 'ORGANIZATION_01_OFFICIAL',
};

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
};

export function isVisualTemplateId(value: unknown): value is VisualTemplateId {
  return typeof value === 'string' && (VISUAL_TEMPLATE_IDS as readonly string[]).includes(value);
}

export function listVisualTemplatesForConcept(concept: VisualTemplateConcept): VisualTemplateId[] {
  return VISUAL_TEMPLATE_IDS.filter((id) => VISUAL_TEMPLATE_CONCEPT[id] === concept);
}
