/**
 * Design QA 고정 샘플 데이터.
 * Figma Make와 화면 비교 시 이 값을 기준으로 초대장을 채운다.
 * @see docs/DESIGN_QA_CHECKLIST.md
 */

export const DESIGN_QA_VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1440, height: 1024 },
} as const;

export const DESIGN_QA_WEDDING_SAMPLE = {
  groomName: '이준혁',
  brideName: '김지은',
  title: '이준혁 ♥ 김지은',
  eventDateLabel: '2025년 11월 15일 토요일 오후 2시 30분',
  eventDateIso: '2025-11-15T14:30:00+09:00',
  venueName: '더 웨딩홀 그랜드볼룸',
  locationText: '더 웨딩홀 그랜드볼룸 · 서울 강남구',
  hasHero: true,
  hasGroomPhoto: true,
  hasBridePhoto: true,
  hasGallery: true,
  hasAccounts: true,
  hasRsvp: true,
  hasGuestbook: true,
  images: {
    hero: '/images/wedding/classic/hero.jpg',
    groom: '/images/wedding/classic/groom.jpg',
    bride: '/images/wedding/classic/bride.jpg',
    map: '/images/wedding/classic/map.jpg',
    gallery: Array.from({ length: 12 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      return `/images/wedding/classic/gallery_${number}.jpg`;
    }),
  },
} as const;

export const DESIGN_QA_FUNERAL_SAMPLE = {
  deceasedName: '홍길동',
  deathDateLabel: '별세일 포함',
  hallName: '빈소 포함',
  funeralDateLabel: '발인 포함',
  burialLabel: '장지 포함',
  hasMessage: true,
  hasAccounts: true,
  hasGuestbook: true,
} as const;

export const DESIGN_QA_GENERAL_SAMPLE = {
  eventTitle: '행사명 포함',
  hasSchedule: true,
  hasLocation: true,
  hasIntro: true,
  hasGallery: true,
  hasRsvp: true,
} as const;

/** 캡처 파일명 규칙 (artifacts/design-qa/) */
export const DESIGN_QA_CAPTURE_FILES = {
  mobile: [
    'mobile-main.png',
    'mobile-email-start.png',
    'mobile-email-verify.png',
    'mobile-concept-selection.png',
    'mobile-editor.png',
    'mobile-public-invitation.png',
    'mobile-publish-complete.png',
    'mobile-my-invitations.png',
    'mobile-rsvp-management.png',
  ],
  desktop: [
    'desktop-main.png',
    'desktop-email-start.png',
    'desktop-email-verify.png',
    'desktop-concept-selection.png',
    'desktop-editor.png',
    'desktop-public-invitation.png',
    'desktop-publish-complete.png',
    'desktop-my-invitations.png',
    'desktop-rsvp-management.png',
  ],
} as const;
