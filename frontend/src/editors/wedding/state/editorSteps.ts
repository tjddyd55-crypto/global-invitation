import type { UnifiedStepItem } from '@/src/editors/shared/UnifiedStepperNav';
import type { WeddingEditorState } from '@/src/editors/wedding/state/weddingEditor.types';

export type EditorSectionKey =
  | 'setup'
  | 'organization'
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

/**
 * Concept editor steps SSOT — PC sidebar / mobile stepper / nav 공통.
 * GENERAL은 일정 입력을 기본 정보에 통합하므로 schedule editor step 없음.
 * ORGANIZATION은 branding step 추가 (organization key).
 * Preview/Public `schedule` 섹션은 renderer 전용으로 계속 존재한다.
 */
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

  if (conceptType === 'ORGANIZATION') {
    return [
      { id: 0, key: 'organization', title: '기관 브랜딩', previewSectionId: 'organization' },
      { id: 1, key: 'setup', title: '기본 정보', previewSectionId: 'basic' },
      { id: 2, key: 'message', title: '행사 소개', previewSectionId: 'greeting' },
      { id: 3, key: 'hero', title: '대표 이미지', previewSectionId: 'hero' },
      { id: 4, key: 'gallery', title: '갤러리', previewSectionId: 'gallery' },
      { id: 5, key: 'location', title: '위치 안내', previewSectionId: 'location' },
      { id: 6, key: 'accounts', title: '참가비·계좌 정보', previewSectionId: 'accounts' },
      { id: 7, key: 'rsvp', title: '참석 여부', previewSectionId: 'rsvp' },
      { id: 8, key: 'music', title: '음악 설정', previewSectionId: 'music' },
      { id: 9, key: 'share', title: '공유 설정', previewSectionId: 'share' },
    ];
  }

  // GENERAL — 9 steps (일정 입력은 setup/기본 정보 SSOT)
  return [
    { id: 0, key: 'setup', title: '기본 정보', previewSectionId: 'basic' },
    { id: 1, key: 'message', title: '행사 소개', previewSectionId: 'greeting' },
    { id: 2, key: 'hero', title: '대표 이미지', previewSectionId: 'hero' },
    { id: 3, key: 'gallery', title: '갤러리', previewSectionId: 'gallery' },
    { id: 4, key: 'location', title: '위치 안내', previewSectionId: 'location' },
    { id: 5, key: 'accounts', title: '참가비·계좌 정보', previewSectionId: 'accounts' },
    { id: 6, key: 'rsvp', title: '참석 여부', previewSectionId: 'rsvp' },
    { id: 7, key: 'music', title: '음악 설정', previewSectionId: 'music' },
    { id: 8, key: 'share', title: '공유 설정', previewSectionId: 'share' },
  ];
}
