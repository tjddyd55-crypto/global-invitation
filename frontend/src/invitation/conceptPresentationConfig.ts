/**
 * Concept presentation SSOT — Editor / Preview / Public 공통.
 * 페이지별 if 중복 금지. Wedding fallback 금지.
 */
export type InvitationConceptType = 'WEDDING' | 'FUNERAL' | 'GENERAL';

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
  | 'share';

export type ConceptPresentationConfig = {
  couple: boolean;
  deceased: boolean;
  schedule: boolean;
  gallery: boolean;
  account: boolean;
  rsvp: boolean;
  comments: boolean;
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
    rsvp: true,
    comments: true,
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
    rsvp: false,
    comments: true,
    sections: ['hero', 'deceased', 'schedule', 'location', 'account', 'comments', 'share'],
    commentsTitle: '추모 메시지',
    commentsSubtitle: '고인을 기리는 마음을 남겨주세요',
    commentsPlaceholder: '추모의 마음을 남겨주세요',
  },
  GENERAL: {
    couple: false,
    deceased: false,
    schedule: true,
    gallery: true,
    account: false,
    rsvp: true,
    comments: true,
    sections: [
      'hero',
      'introduction',
      'schedule',
      'gallery',
      'location',
      'rsvp',
      'comments',
      'share',
    ],
    commentsTitle: '메시지를 남겨주세요',
    commentsSubtitle: '행사에 전할 메시지를 남겨주세요',
    commentsPlaceholder: '축하나 응원의 메시지를 남겨주세요',
  },
};

export function getConceptPresentationConfig(
  conceptType: InvitationConceptType | string | null | undefined
): ConceptPresentationConfig {
  if (conceptType === 'WEDDING' || conceptType === 'FUNERAL' || conceptType === 'GENERAL') {
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
