import type { UnifiedStepItem } from '@/src/editors/shared/UnifiedStepperNav';
import type { WeddingEditorState } from '@/src/editors/wedding/state/weddingEditor.types';

export type EditorSectionKey =
  | 'setup'
  | 'message'
  | 'hero'
  | 'couple'
  | 'schedule'
  | 'gallery'
  | 'location'
  | 'accounts'
  | 'rsvp'
  | 'share';

export type EditorSectionItem = UnifiedStepItem & {
  key: EditorSectionKey;
};

type ConceptType = WeddingEditorState['setup']['conceptType'];

/** Concept editor steps SSOT — PC sidebar / mobile stepper / nav 공통 */
export function resolveVisibleSections(conceptType: ConceptType): EditorSectionItem[] {
  if (conceptType === 'WEDDING') {
    return [
      { id: 0, key: 'setup', title: '기본 정보' },
      { id: 1, key: 'message', title: '인사말' },
      { id: 2, key: 'hero', title: '대표 이미지' },
      { id: 3, key: 'couple', title: '신랑 · 신부' },
      { id: 4, key: 'gallery', title: '갤러리' },
      { id: 5, key: 'location', title: '위치 안내' },
      { id: 6, key: 'accounts', title: '계좌 정보' },
      { id: 7, key: 'rsvp', title: '참석 여부' },
      { id: 8, key: 'share', title: '공유 설정' },
    ];
  }

  if (conceptType === 'FUNERAL') {
    return [
      { id: 0, key: 'setup', title: '기본 정보' },
      { id: 1, key: 'message', title: '부고문' },
      { id: 2, key: 'hero', title: '대표 이미지' },
      { id: 3, key: 'couple', title: '고인 정보' },
      { id: 4, key: 'schedule', title: '장례 일정' },
      { id: 5, key: 'location', title: '위치 안내' },
      { id: 6, key: 'accounts', title: '계좌 정보' },
      { id: 7, key: 'rsvp', title: '참석 여부' },
      { id: 8, key: 'share', title: '공유 설정' },
    ];
  }

  // GENERAL — 9 steps
  return [
    { id: 0, key: 'setup', title: '기본 정보' },
    { id: 1, key: 'message', title: '행사 소개' },
    { id: 2, key: 'hero', title: '대표 이미지' },
    { id: 3, key: 'schedule', title: '일정' },
    { id: 4, key: 'gallery', title: '갤러리' },
    { id: 5, key: 'location', title: '위치 안내' },
    { id: 6, key: 'accounts', title: '참가비·계좌 정보' },
    { id: 7, key: 'rsvp', title: '참석 여부' },
    { id: 8, key: 'share', title: '공유 설정' },
  ];
}
