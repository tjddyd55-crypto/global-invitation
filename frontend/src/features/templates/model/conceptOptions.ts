/* eslint-disable i18next/no-literal-string */
import type { ComponentType } from 'react';
import {
  BookOpenIcon,
  BuildingIcon,
  CalendarDaysIcon,
  HeartIcon,
} from '@/src/ui/icons/ConceptIcons';
import type { InvitationConceptType } from '@/src/invitation/conceptTypes';

export type ConceptType = InvitationConceptType;

export type ConceptOption = {
  value: ConceptType;
  label: string;
  badge: string;
  description: string;
  homeTitle: string;
  homeDescription: string;
  fieldsSummary: string;
  accent: string;
  accentSoft: string;
  accentActiveBg: string;
  features: string[];
  Icon: ComponentType<{ size?: number; className?: string }>;
};

/**
 * Concept catalog SSOT — create picker + home category cards.
 * Keep Wedding / Funeral / General / Organization in this one list.
 */
export const CONCEPT_OPTIONS: ConceptOption[] = [
  {
    value: 'WEDDING',
    label: '결혼식으로 시작',
    badge: '결혼식',
    description: '소중한 날, 소중한 분들에게 전하는 정성스러운 청첩장',
    homeTitle: '결혼식 초대장',
    homeDescription: '정성스러운 청첩장으로 소중한 분들을 초대하세요',
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
    homeTitle: '부고장',
    homeDescription: '고인을 기리며 조문 안내를 정중하게 전달하세요',
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
    homeTitle: '일반 행사',
    homeDescription: '세미나, 파티, 모임 등 다양한 행사를 안내하세요',
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
    homeTitle: '기업·단체 초대장',
    homeDescription: '기관 행사, 협회 모임, 공식 초청에 맞는 템플릿',
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
