'use client';

import { useCallback, useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { createInvitation } from '@/src/lib/api';
import { fetchCurrentUser } from '@/src/shared/auth';
import {
  BookOpenIcon,
  BuildingIcon,
  CalendarDaysIcon,
  HeartIcon,
} from '@/src/ui/icons/ConceptIcons';
import { sanitizeVisualTemplateIdForSave } from '@/src/templates/visualTemplate/resolveVisualTemplateId';
import {
  clearPendingVisualTemplate,
  savePendingVisualTemplate,
  VISUAL_TEMPLATE_RESUME_PATH,
} from '@/src/features/templates/model/pendingVisualTemplate';
import type { InvitationConceptType } from '@/src/invitation/conceptTypes';
import { isVisualTemplateConceptType } from '@/src/invitation/conceptTypes';

export type ConceptType = InvitationConceptType;

const CONCEPT_CREATE_NEXT_PATH = '/create/concept';

export const CONCEPT_OPTIONS: Array<{
  value: ConceptType;
  label: string;
  badge: string;
  description: string;
  fieldsSummary: string;
  accent: string;
  accentSoft: string;
  accentActiveBg: string;
  features: string[];
  Icon: ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    value: 'WEDDING',
    label: '결혼식으로 시작',
    badge: '결혼식',
    description: '소중한 날, 소중한 분들에게 전하는 정성스러운 청첩장',
    fieldsSummary: '신랑 · 신부, 예식장, 갤러리, 계좌, 참석 여부',
    accent: '#BE185D',
    accentSoft: '#FCE7F3',
    accentActiveBg: '#FDF2F8',
    features: [
      '신랑 · 신부 정보',
      '예식장 · 위치 안내',
      '갤러리',
      '계좌 정보',
      '참석 여부 RSVP',
      '방명록/댓글',
    ],
    Icon: HeartIcon,
  },
  {
    value: 'FUNERAL',
    label: '부고장으로 시작',
    badge: '부고장',
    description: '고인을 기리며 조문 안내를 정중하고 조용하게 전달하는 부고장',
    fieldsSummary: '고인 정보, 빈소, 발인, 조문 안내, 계좌',
    accent: '#374151',
    accentSoft: '#F3F4F6',
    accentActiveBg: '#F9FAFB',
    features: [
      '고인 정보',
      '빈소 · 발인 일정',
      '장례식장 위치 안내',
      '조의금 계좌',
      '추모 메시지',
      '방명록/댓글',
    ],
    Icon: BookOpenIcon,
  },
  {
    value: 'GENERAL',
    label: '일반 행사로 시작',
    badge: '일반 행사',
    description: '세미나, 파티, 동창회 등 다양한 행사를 간편하게 안내',
    fieldsSummary: '행사 소개, 일정, 장소, 갤러리, 참가비, 참석 여부',
    accent: '#1D4ED8',
    accentSoft: '#DBEAFE',
    accentActiveBg: '#EFF6FF',
    features: [
      '행사 소개 · 설명',
      '세부 일정',
      '장소 · 위치 안내',
      '갤러리',
      '참가비 · 계좌 정보',
      '참석 여부 RSVP',
      '댓글/방명록',
    ],
    Icon: CalendarDaysIcon,
  },
  {
    value: 'ORGANIZATION',
    label: '기업·단체 행사로 시작',
    badge: '기업·단체 행사',
    description: '회사·협회·기관·단체의 공식 행사를 위한 초대장',
    fieldsSummary: '조직 로고, 행사 소개, 일정, 장소, 갤러리, 참가비, 참석 여부',
    accent: '#0B1F3A',
    accentSoft: '#E8EEF5',
    accentActiveBg: '#F3F6FA',
    features: [
      '조직 로고 · 조직명',
      '공식 행사 소개',
      '세부 일정 · 장소',
      '갤러리',
      '참가비 · 계좌',
      '참석 여부 RSVP',
      '주최 · 문의',
    ],
    Icon: BuildingIcon,
  },
];

export interface UseCreateInvitationResult {
  creatingConcept: ConceptType | null;
  error: string | null;
  /** Concept only → catalog (WEDDING/GENERAL) or create (FUNERAL). With visualTemplateId → create. */
  start: (concept: ConceptType, visualTemplateId?: string) => Promise<void>;
}

export function useCreateInvitation(): UseCreateInvitationResult {
  const router = useRouter();
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

        const created = await createInvitation({
          templateKey: 'invitation_full',
          conceptType: concept,
          ...(sanitized ? { visualTemplateId: sanitized } : {}),
        });
        clearPendingVisualTemplate();
        router.push(`/editor/${created.id}?concept=${concept}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : '초대장 생성에 실패했습니다.';
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
    [creatingConcept, router]
  );

  return { creatingConcept, error, start };
}
