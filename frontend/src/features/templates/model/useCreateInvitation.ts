'use client';

import { useCallback, useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { createInvitation } from '@/src/lib/api';
import { fetchCurrentUser } from '@/src/shared/auth';
import { BookOpenIcon, CalendarDaysIcon, HeartIcon } from '@/src/ui/icons/ConceptIcons';

export type ConceptType = 'WEDDING' | 'FUNERAL' | 'GENERAL';

export const CONCEPT_OPTIONS: Array<{
  value: ConceptType;
  label: string;
  description: string;
  accent: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    value: 'WEDDING',
    label: '결혼식',
    description: '신랑·신부·혼주 정보와 갤러리·RSVP·계좌 공유까지.',
    accent: '#f43f5e',
    Icon: HeartIcon,
  },
  {
    value: 'FUNERAL',
    label: '부고장',
    description: '고인·장례식장·일정 정보와 근조 안내.',
    accent: '#6b7280',
    Icon: BookOpenIcon,
  },
  {
    value: 'GENERAL',
    label: '일반 행사',
    description: '생일·돌·개업 등 공통 기능 중심 초대장.',
    accent: '#3b82f6',
    Icon: CalendarDaysIcon,
  },
];

export interface UseCreateInvitationResult {
  creatingConcept: ConceptType | null;
  error: string | null;
  start: (concept: ConceptType) => Promise<void>;
}

/**
 * 컨셉 선택 후 초대장 생성.
 * - 인증된 userId 세션이 필수다. 미인증이면 이메일 인증 화면으로 보낸다.
 * - guestToken 기반 신규 생성/폴백은 사용하지 않는다.
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
        const user = await fetchCurrentUser({ useCache: false });
        if (!user) {
          router.replace(`/auth/email?next=${encodeURIComponent('/templates')}`);
          return;
        }

        const created = await createInvitation({
          templateKey: 'invitation_full',
          conceptType: concept,
        });
        router.push(`/editor/${created.id}?concept=${concept}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : '초대장 생성에 실패했습니다.';
        if (message.includes('401') || message.toUpperCase().includes('UNAUTHORIZED')) {
          router.replace(`/auth/email?next=${encodeURIComponent('/templates')}`);
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
