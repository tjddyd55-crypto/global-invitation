/**
 * Home category cards — derived from CONCEPT_OPTIONS (create-flow SSOT).
 */
import { CONCEPT_OPTIONS, type ConceptType } from '@/src/features/templates/model/conceptOptions';

export type MainConceptCard = (typeof CONCEPT_OPTIONS)[number] & {
  key: string;
};

export function listMainConceptCards(): MainConceptCard[] {
  return CONCEPT_OPTIONS.map((option) => ({
    ...option,
    key: option.value.toLowerCase(),
  }));
}

export function isOrganizationConcept(value: ConceptType): boolean {
  return value === 'ORGANIZATION';
}
