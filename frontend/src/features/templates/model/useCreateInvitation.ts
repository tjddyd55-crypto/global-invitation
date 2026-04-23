'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvitation } from '@/src/lib/api';

export type ConceptType = 'WEDDING' | 'FUNERAL' | 'GENERAL';

export const CONCEPT_OPTIONS: Array<{
  value: ConceptType;
  label: string;
  description: string;
  accent: string;
  icon: string;
}> = [
  {
    value: 'WEDDING',
    label: '결혼식',
    description: '신랑·신부·혼주 정보와 갤러리·RSVP·계좌 공유까지.',
    accent: '#f43f5e',
    icon: '💐',
  },
  {
    value: 'FUNERAL',
    label: '부고장',
    description: '고인·장례식장·일정 정보와 근조 안내.',
    accent: '#6b7280',
    icon: '🤍',
  },
  {
    value: 'GENERAL',
    label: '일반 행사',
    description: '생일·돌·개업 등 공통 기능 중심 초대장.',
    accent: '#3b82f6',
    icon: '🎉',
  },
];

export interface UseCreateInvitationResult {
  creatingConcept: ConceptType | null;
  error: string | null;
  start: (concept: ConceptType) => Promise<void>;
}

/**
 * 템플릿 카드의 "시작하기" 동작을 담당한다.
 * - PC/Mobile UI 가 공통으로 쓴다.
 * - 실패 시 게스트용 임시 editor 경로로 폴백한다.
 */
export function useCreateInvitation(): UseCreateInvitationResult {
  const router = useRouter();
  const [creatingConcept, setCreating] = useState<ConceptType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (concept: ConceptType) => {
      if (creatingConcept) return;
      setCreating(concept);
      setError(null);
      try {
        const created = await createInvitation('invitation_full');
        router.push(`/editor/${created.id}?concept=${concept}`);
      } catch (err) {
        // 게스트 임시 경로로 폴백: 서버 연결 실패 시에도 편집기 진입은 가능하도록.
        const fallback = `/editor/new?template=invitation-full-default&concept=${concept}`;
        router.push(fallback);
        setError(err instanceof Error ? err.message : '네트워크 오류 — 임시 편집기로 이동합니다.');
      } finally {
        setCreating(null);
      }
    },
    [creatingConcept, router],
  );

  return { creatingConcept, error, start };
}
