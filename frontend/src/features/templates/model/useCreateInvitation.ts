'use client';

import { useCallback, useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { createInvitation } from '@/src/lib/api';
import { fetchCurrentUser } from '@/src/shared/auth';
import { BookOpenIcon, CalendarDaysIcon, HeartIcon } from '@/src/ui/icons/ConceptIcons';

export type ConceptType = 'WEDDING' | 'FUNERAL' | 'GENERAL';

const CONCEPT_CREATE_NEXT_PATH = '/create/concept';

export const CONCEPT_OPTIONS: Array<{
  value: ConceptType;
  label: string;
  description: string;
  accent: string;
  accentSoft: string;
  /** Figma Make 컨셉 카드 기능 목록 (에디터에서 실제로 켜지는 섹션과 1:1 매칭). */
  features: string[];
  Icon: ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    value: 'WEDDING',
    label: '결혼식',
    description: '신랑·신부·혼주 정보와 갤러리·RSVP·계좌 공유까지.',
    accent: 'var(--mk-wedding)',
    accentSoft: 'var(--mk-wedding-soft)',
    features: [
      '신랑 · 신부 소개',
      '예식 일정 안내',
      '갤러리',
      'Google 지도 위치',
      '마음 전하실 곳(계좌)',
      '참석 여부 확인',
      '방명록',
    ],
    Icon: HeartIcon,
  },
  {
    value: 'FUNERAL',
    label: '부고장',
    description: '고인·장례식장·일정 정보와 근조 안내.',
    accent: 'var(--mk-funeral)',
    accentSoft: 'var(--mk-funeral-soft)',
    features: [
      '故人 소개',
      '발인 일정 안내',
      '빈소 위치 안내',
      'Google 지도 위치',
      '조의금 계좌 안내',
      '조문 여부 확인',
      '삼가 조의 메시지',
    ],
    Icon: BookOpenIcon,
  },
  {
    value: 'GENERAL',
    label: '일반 행사',
    description: '생일·돌·개업 등 공통 기능 중심 초대장.',
    accent: 'var(--mk-general)',
    accentSoft: 'var(--mk-general-soft)',
    features: [
      '행사 소개',
      '일정 안내',
      '갤러리',
      'Google 지도 위치',
      '참가비 · 계좌 정보',
      '참석 여부 확인',
      '댓글 · 방명록',
    ],
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
          router.replace(`/auth/email?next=${encodeURIComponent(CONCEPT_CREATE_NEXT_PATH)}`);
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
