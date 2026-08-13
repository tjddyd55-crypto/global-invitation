/**
 * Home category cards — derived from CONCEPT_OPTIONS (create-flow SSOT).
 */
import {
  CONCEPT_OPTIONS,
  localizeConceptOptions,
  type ConceptOption,
  type ConceptType,
} from '@/src/features/templates/model/conceptOptions';

export type MainConceptCard = ConceptOption & {
  key: string;
};

export function listMainConceptCards(t?: (key: string) => string): MainConceptCard[] {
  const options = t ? localizeConceptOptions(t) : CONCEPT_OPTIONS;
  return options.map((option) => ({
    ...option,
    key: option.value.toLowerCase(),
  }));
}

export function isOrganizationConcept(value: ConceptType): boolean {
  return value === 'ORGANIZATION';
}
