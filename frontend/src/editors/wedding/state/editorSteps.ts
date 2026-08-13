import type { UnifiedStepItem } from '@/src/editors/shared/UnifiedStepperNav';
import type { WeddingEditorState } from '@/src/editors/wedding/state/weddingEditor.types';
import { invitationT } from '@/src/i18n/invitationT';
import type { ProductLocaleId } from '@/src/i18n/productLocales';

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
export function resolveVisibleSections(
  conceptType: ConceptType,
  locale: ProductLocaleId = 'ko-KR'
): EditorSectionItem[] {
  const t = (key: string) => invitationT(locale, key);
  if (conceptType === 'WEDDING') {
    return [
      { id: 0, key: 'setup', title: t('editor.section.basicInfo'), previewSectionId: 'hero' },
      { id: 1, key: 'message', title: t('editor.section.greeting'), previewSectionId: 'greeting' },
      { id: 2, key: 'hero', title: t('editor.section.hero'), previewSectionId: 'hero' },
      { id: 3, key: 'couple', title: t('editor.section.couple'), previewSectionId: 'couple' },
      { id: 4, key: 'gallery', title: t('editor.section.gallery'), previewSectionId: 'gallery' },
      { id: 5, key: 'location', title: t('editor.section.location'), previewSectionId: 'location' },
      { id: 6, key: 'accounts', title: t('editor.section.accounts'), previewSectionId: 'accounts' },
      { id: 7, key: 'rsvp', title: t('editor.section.rsvp'), previewSectionId: 'rsvp' },
      { id: 8, key: 'music', title: t('editor.section.music'), previewSectionId: 'music' },
      { id: 9, key: 'share', title: t('editor.section.sharing'), previewSectionId: 'share' },
    ];
  }

  if (conceptType === 'FUNERAL') {
    return [
      { id: 0, key: 'setup', title: t('editor.section.basicInfo'), previewSectionId: 'hero' },
      { id: 1, key: 'message', title: t('editor.section.memorialMessage'), previewSectionId: 'greeting' },
      { id: 2, key: 'hero', title: t('editor.section.hero'), previewSectionId: 'hero' },
      { id: 3, key: 'couple', title: t('editor.section.deceased'), previewSectionId: 'deceased' },
      { id: 4, key: 'schedule', title: t('editor.section.schedule'), previewSectionId: 'schedule' },
      { id: 5, key: 'location', title: t('editor.section.location'), previewSectionId: 'location' },
      { id: 6, key: 'accounts', title: t('editor.section.accounts'), previewSectionId: 'accounts' },
      { id: 7, key: 'rsvp', title: t('editor.section.rsvp'), previewSectionId: 'rsvp' },
      { id: 8, key: 'music', title: t('editor.section.music'), previewSectionId: 'music' },
      { id: 9, key: 'share', title: t('editor.section.sharing'), previewSectionId: 'share' },
    ];
  }

  if (conceptType === 'ORGANIZATION') {
    return [
      { id: 0, key: 'organization', title: t('editor.section.branding'), previewSectionId: 'organization' },
      { id: 1, key: 'setup', title: t('editor.section.basicInfo'), previewSectionId: 'basic' },
      { id: 2, key: 'message', title: t('editor.section.introduction'), previewSectionId: 'greeting' },
      { id: 3, key: 'hero', title: t('editor.section.hero'), previewSectionId: 'hero' },
      { id: 4, key: 'gallery', title: t('editor.section.gallery'), previewSectionId: 'gallery' },
      { id: 5, key: 'location', title: t('editor.section.location'), previewSectionId: 'location' },
      { id: 6, key: 'accounts', title: t('editor.section.payment'), previewSectionId: 'accounts' },
      { id: 7, key: 'rsvp', title: t('editor.section.rsvp'), previewSectionId: 'rsvp' },
      { id: 8, key: 'music', title: t('editor.section.music'), previewSectionId: 'music' },
      { id: 9, key: 'share', title: t('editor.section.sharing'), previewSectionId: 'share' },
    ];
  }

  return [
    { id: 0, key: 'setup', title: t('editor.section.basicInfo'), previewSectionId: 'basic' },
    { id: 1, key: 'message', title: t('editor.section.introduction'), previewSectionId: 'greeting' },
    { id: 2, key: 'hero', title: t('editor.section.hero'), previewSectionId: 'hero' },
    { id: 3, key: 'gallery', title: t('editor.section.gallery'), previewSectionId: 'gallery' },
    { id: 4, key: 'location', title: t('editor.section.location'), previewSectionId: 'location' },
    { id: 5, key: 'accounts', title: t('editor.section.payment'), previewSectionId: 'accounts' },
    { id: 6, key: 'rsvp', title: t('editor.section.rsvp'), previewSectionId: 'rsvp' },
    { id: 7, key: 'music', title: t('editor.section.music'), previewSectionId: 'music' },
    { id: 8, key: 'share', title: t('editor.section.sharing'), previewSectionId: 'share' },
  ];
}
