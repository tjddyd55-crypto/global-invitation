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
  | 'music'
  | 'share';

export type EditorSectionItem = UnifiedStepItem & {
  key: EditorSectionKey;
  /** Phone Preview scroll target (SSOT with editorPreviewSections) */
  previewSectionId?: string;
};

type ConceptType = WeddingEditorState['setup']['conceptType'];

/** Concept editor steps SSOT — PC sidebar / mobile stepper / nav 공통 (10 steps) */
export function resolveVisibleSections(conceptType: ConceptType): EditorSectionItem[] {
  if (conceptType === 'WEDDING') {
    return [
      { id: 0, key: 'setup', title: '기본 정보', previewSectionId: 'hero' },
      { id: 1, key: 'message', title: '인사말', previewSectionId: 'greeting' },
      { id: 2, key: 'hero', title: '대표 이미지', previewSectionId: 'hero' },
      { id: 3, key: 'couple', title: '신랑 · 신부', previewSectionId: 'couple' },
      { id: 4, key: 'gallery', title: '갤러리', previewSectionId: 'gallery' },
      { id: 5, key: 'location', title: '위치 안내', previewSectionId: 'location' },
      { id: 6, key: 'accounts', title: '계좌 정보', previewSectionId: 'accounts' },
      { id: 7, key: 'rsvp', title: '참석 여부', previewSectionId: 'rsvp' },
      { id: 8, key: 'music', title: '음악 설정', previewSectionId: 'music' },
      { id: 9, key: 'share', title: '공유 설정', previewSectionId: 'share' },
    ];
  }

  if (conceptType === 'FUNERAL') {
    return [
      { id: 0, key: 'setup', title: '기본 정보', previewSectionId: 'hero' },
      { id: 1, key: 'message', title: '부고문', previewSectionId: 'greeting' },
      { id: 2, key: 'hero', title: '대표 이미지', previewSectionId: 'hero' },
      { id: 3, key: 'couple', title: '고인 정보', previewSectionId: 'deceased' },
      { id: 4, key: 'schedule', title: '장례 일정', previewSectionId: 'schedule' },
      { id: 5, key: 'location', title: '위치 안내', previewSectionId: 'location' },
      { id: 6, key: 'accounts', title: '계좌 정보', previewSectionId: 'accounts' },
      { id: 7, key: 'rsvp', title: '참석 여부', previewSectionId: 'rsvp' },
      { id: 8, key: 'music', title: '음악 설정', previewSectionId: 'music' },
      { id: 9, key: 'share', title: '공유 설정', previewSectionId: 'share' },
    ];
  }

  // GENERAL — 10 steps (setup=basic text, hero=media — 분리)
  return [
    { id: 0, key: 'setup', title: '기본 정보', previewSectionId: 'basic' },
    { id: 1, key: 'message', title: '행사 소개', previewSectionId: 'greeting' },
    { id: 2, key: 'hero', title: '대표 이미지', previewSectionId: 'hero' },
    { id: 3, key: 'schedule', title: '일정', previewSectionId: 'schedule' },
    { id: 4, key: 'gallery', title: '갤러리', previewSectionId: 'gallery' },
    { id: 5, key: 'location', title: '위치 안내', previewSectionId: 'location' },
    { id: 6, key: 'accounts', title: '참가비·계좌 정보', previewSectionId: 'accounts' },
    { id: 7, key: 'rsvp', title: '참석 여부', previewSectionId: 'rsvp' },
    { id: 8, key: 'music', title: '음악 설정', previewSectionId: 'music' },
    { id: 9, key: 'share', title: '공유 설정', previewSectionId: 'share' },
  ];
}
