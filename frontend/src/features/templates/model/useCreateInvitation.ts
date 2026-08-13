'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvitation } from '@/src/lib/api';
import { buildOrganizationCreateData } from '@/src/invitation/buildOrganizationCreateData';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { isVisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { fetchCurrentUser } from '@/src/shared/auth';
import { useI18n } from '@/src/contexts/I18nContext';
import { sanitizeVisualTemplateIdForSave } from '@/src/templates/visualTemplate/resolveVisualTemplateId';
import {
  clearPendingVisualTemplate,
  savePendingVisualTemplate,
  VISUAL_TEMPLATE_RESUME_PATH,
} from '@/src/features/templates/model/pendingVisualTemplate';
import { isVisualTemplateConceptType } from '@/src/invitation/conceptTypes';
import type { ConceptType } from './conceptOptions';

export {
  CONCEPT_OPTIONS,
  localizeConceptOptions,
  type ConceptType,
} from './conceptOptions';

const CONCEPT_CREATE_NEXT_PATH = '/create/concept';

export interface UseCreateInvitationResult {
  creatingConcept: ConceptType | null;
  error: string | null;
  /** Concept only → catalog (WEDDING/GENERAL) or create (FUNERAL). With visualTemplateId → create. */
  start: (concept: ConceptType, visualTemplateId?: string) => Promise<void>;
}

export function useCreateInvitation(): UseCreateInvitationResult {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [creatingConcept, setCreating] = useState<ConceptType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (concept: ConceptType, visualTemplateId?: string) => {
      if (creatingConcept) return;

      // Visual-template concepts without template → catalog step
      if (isVisualTemplateConceptType(concept) && !visualTemplateId) {
        router.push(`/create/templates?concept=${concept}`);
        return;
      }

      setCreating(concept);
      setError(null);
      try {
        const user = await fetchCurrentUser({ useCache: false });
        if (!user) {
          if (visualTemplateId && isVisualTemplateConceptType(concept)) {
            savePendingVisualTemplate({
              conceptType: concept,
              visualTemplateId,
              createdAt: Date.now(),
            });
            router.replace(`/auth/email?next=${encodeURIComponent(VISUAL_TEMPLATE_RESUME_PATH)}`);
            return;
          }
          router.replace(`/auth/email?next=${encodeURIComponent(CONCEPT_CREATE_NEXT_PATH)}`);
          return;
        }

        const sanitized = isVisualTemplateConceptType(concept)
          ? sanitizeVisualTemplateIdForSave(visualTemplateId, concept)
          : undefined;

        const organizationData =
          concept === 'ORGANIZATION' && sanitized && isVisualTemplateId(sanitized)
            ? buildOrganizationCreateData(sanitized as VisualTemplateId)
            : undefined;

        const created = await createInvitation({
          templateKey: 'invitation_full',
          conceptType: concept,
          locale,
          language: locale,
          ...(sanitized ? { visualTemplateId: sanitized } : {}),
          ...(organizationData ? { data: organizationData } : {}),
        });
        clearPendingVisualTemplate();
        router.push(`/editor/${created.id}?concept=${concept}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('createFailed');
        if (message.includes('401') || message.toUpperCase().includes('UNAUTHORIZED')) {
          if (visualTemplateId && isVisualTemplateConceptType(concept)) {
            savePendingVisualTemplate({
              conceptType: concept,
              visualTemplateId,
              createdAt: Date.now(),
            });
            router.replace(`/auth/email?next=${encodeURIComponent(VISUAL_TEMPLATE_RESUME_PATH)}`);
            return;
          }
          router.replace(`/auth/email?next=${encodeURIComponent(CONCEPT_CREATE_NEXT_PATH)}`);
          return;
        }
        setError(message);
      } finally {
        setCreating(null);
      }
    },
    [creatingConcept, locale, router, t]
  );

  return { creatingConcept, error, start };
}
