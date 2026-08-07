/**
 * Concept presentation SSOT — Editor / Preview / Public 공통.
 * 페이지별 if 중복 금지. Wedding fallback 금지.
 */
import type { InvitationConceptType } from '@/src/invitation/conceptTypes';

export type { InvitationConceptType } from '@/src/invitation/conceptTypes';

export type ConceptSectionKey =
  | 'hero'
  | 'introduction'
  | 'couple'
  | 'deceased'
  | 'schedule'
  | 'gallery'
  | 'location'
  | 'account'
  | 'rsvp'
  | 'comments'
  | 'share'
  | 'footer'
  | 'organization';

export type ConceptPresentationConfig = {
  couple: boolean;
  deceased: boolean;
  schedule: boolean;
  gallery: boolean;
  account: boolean;
  /** true면 accountEnabled 토글로 공개 여부 제어 */
  accountOptional: boolean;
  /** optional일 때 신규 기본값 */
  accountDefaultEnabled: boolean;
  accountsTitle: string;
  rsvp: boolean;
  comments: boolean;
  /** Editor 음악 단계 표시 — 현재 전 concept true */
  music: boolean;
  /** 신규 초대장 기본값 — 자동 삽입 금지 */
  musicDefaultEnabled: boolean;
  organization: boolean;
  sections: ConceptSectionKey[];
  commentsTitle: string;
  commentsSubtitle: string;
  commentsPlaceholder: string;
};

const CONFIG: Record<InvitationConceptType, ConceptPresentationConfig> = {
  WEDDING: {
    couple: true,
    deceased: false,
    schedule: true,
    gallery: true,
    account: true,
    accountOptional: false,
    accountDefaultEnabled: true,
    accountsTitle: '마음 전하실 곳',
    rsvp: true,
    comments: true,
    music: true,
    musicDefaultEnabled: false,
    organization: false,
    sections: [
      'hero',
      'introduction',
      'couple',
      'schedule',
      'gallery',
      'location',
      'account',
      'rsvp',
      'comments',
      'share',
      'footer',
    ],
    commentsTitle: '축하 메시지',
    commentsSubtitle: '두 분께 축하의 마음을 남겨주세요',
    commentsPlaceholder: '축하나 응원의 메시지를 남겨주세요',
  },
  FUNERAL: {
    couple: false,
    deceased: true,
    schedule: true,
    gallery: false,
    account: true,
    accountOptional: false,
    accountDefaultEnabled: true,
    accountsTitle: '마음 전하실 곳',
    rsvp: true,
    comments: true,
    music: true,
    musicDefaultEnabled: false,
    organization: false,
    sections: [
      'hero',
      'deceased',
      'schedule',
      'location',
      'account',
      'rsvp',
      'comments',
      'share',
      'footer',
    ],
    commentsTitle: '추모 메시지',
    commentsSubtitle: '고인을 기리는 마음을 남겨주세요',
    commentsPlaceholder: '추모의 마음을 남겨주세요',
  },
  GENERAL: {
    couple: false,
    deceased: false,
    schedule: true,
    gallery: true,
    account: true,
    accountOptional: true,
    accountDefaultEnabled: false,
    accountsTitle: '참가비 및 입금 안내',
    rsvp: true,
    comments: true,
    music: true,
    musicDefaultEnabled: false,
    organization: false,
    sections: [
      'hero',
      'introduction',
      'schedule',
      'gallery',
      'location',
      'account',
      'rsvp',
      'comments',
      'share',
      'footer',
    ],
    commentsTitle: '메시지를 남겨주세요',
    commentsSubtitle: '행사에 전할 메시지를 남겨주세요',
    commentsPlaceholder: '축하나 응원의 메시지를 남겨주세요',
  },
  ORGANIZATION: {
    couple: false,
    deceased: false,
    schedule: true,
    gallery: true,
    account: true,
    accountOptional: true,
    accountDefaultEnabled: true,
    accountsTitle: '참가비 안내',
    rsvp: true,
    comments: true,
    music: true,
    musicDefaultEnabled: false,
    organization: true,
    sections: [
      'hero',
      'organization',
      'introduction',
      'schedule',
      'gallery',
      'location',
      'account',
      'rsvp',
      'comments',
      'share',
      'footer',
    ],
    commentsTitle: '메시지를 남겨주세요',
    commentsSubtitle: '행사에 전할 메시지를 남겨주세요',
    commentsPlaceholder: '참석 소감이나 응원의 메시지를 남겨주세요',
  },
};

export function getConceptPresentationConfig(
  conceptType: InvitationConceptType | string | null | undefined
): ConceptPresentationConfig {
  if (
    conceptType === 'WEDDING' ||
    conceptType === 'FUNERAL' ||
    conceptType === 'GENERAL' ||
    conceptType === 'ORGANIZATION'
  ) {
    return CONFIG[conceptType];
  }
  // 불명 → Wedding 금지. GENERAL 정책으로 안전 폴백.
  return CONFIG.GENERAL;
}

export function conceptAllowsSection(
  conceptType: InvitationConceptType | string | null | undefined,
  section: ConceptSectionKey
): boolean {
  return getConceptPresentationConfig(conceptType).sections.includes(section);
}

/** 섹션 존재 조건 SSOT — 페이지별 개별 조건문 대신 사용 */
export function getInvitationSections(
  conceptType: InvitationConceptType | string | null | undefined,
  flags: {
    hasIntroduction?: boolean;
    hasSchedule?: boolean;
    hasGallery?: boolean;
    hasLocation?: boolean;
    hasAccounts?: boolean;
    hasRsvp?: boolean;
    hasComments?: boolean;
    hasShare?: boolean;
  } = {}
): ConceptSectionKey[] {
  const config = getConceptPresentationConfig(conceptType);
  return config.sections.filter((section) => {
    switch (section) {
      case 'introduction':
        return flags.hasIntroduction !== false;
      case 'schedule':
        return config.schedule && flags.hasSchedule !== false;
      case 'gallery':
        return config.gallery && Boolean(flags.hasGallery);
      case 'location':
        return flags.hasLocation !== false;
      case 'account':
        return config.account && Boolean(flags.hasAccounts);
      case 'rsvp':
        return config.rsvp && Boolean(flags.hasRsvp);
      case 'comments':
        return config.comments && flags.hasComments !== false;
      case 'share':
        return flags.hasShare !== false;
      case 'couple':
        return config.couple;
      case 'deceased':
        return config.deceased;
      case 'organization':
        return config.organization;
      default:
        return true;
    }
  });
}
