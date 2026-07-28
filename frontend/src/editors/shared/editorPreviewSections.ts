/**
 * Editor step → Phone Preview section scroll SSOT.
 * DOM index 기반 scroll 금지. data-section-id / data-preview-section 계약.
 */

export type EditorPreviewSectionId =
  | 'hero'
  | 'greeting'
  | 'couple'
  | 'schedule'
  | 'gallery'
  | 'location'
  | 'accounts'
  | 'rsvp'
  | 'comments'
  | 'share'
  | 'deceased';

/** editorSteps EditorSectionKey 와 동일 */
export type EditorStepKey =
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

const WEDDING_STEP_TO_SECTION: Record<EditorStepKey, EditorPreviewSectionId> = {
  setup: 'hero',
  message: 'greeting',
  hero: 'hero',
  couple: 'couple',
  schedule: 'schedule',
  gallery: 'gallery',
  location: 'location',
  accounts: 'accounts',
  rsvp: 'rsvp',
  share: 'share',
};

const GENERAL_STEP_TO_SECTION: Record<EditorStepKey, EditorPreviewSectionId> = {
  setup: 'hero',
  message: 'greeting',
  hero: 'hero',
  couple: 'greeting',
  schedule: 'schedule',
  gallery: 'gallery',
  location: 'location',
  accounts: 'accounts',
  rsvp: 'rsvp',
  share: 'share',
};

const FUNERAL_STEP_TO_SECTION: Record<EditorStepKey, EditorPreviewSectionId> = {
  setup: 'hero',
  message: 'greeting',
  hero: 'hero',
  couple: 'deceased',
  schedule: 'schedule',
  gallery: 'location',
  location: 'location',
  accounts: 'accounts',
  rsvp: 'rsvp',
  share: 'share',
};

const SECTION_FALLBACKS: EditorPreviewSectionId[] = [
  'hero',
  'greeting',
  'couple',
  'deceased',
  'schedule',
  'gallery',
  'location',
  'accounts',
  'rsvp',
  'comments',
  'share',
];

export function resolveEditorPreviewSectionId(
  stepKey: string,
  conceptType: 'WEDDING' | 'FUNERAL' | 'GENERAL' = 'WEDDING'
): EditorPreviewSectionId {
  const map =
    conceptType === 'FUNERAL'
      ? FUNERAL_STEP_TO_SECTION
      : conceptType === 'GENERAL'
        ? GENERAL_STEP_TO_SECTION
        : WEDDING_STEP_TO_SECTION;
  const key = stepKey as EditorStepKey;
  return map[key] || 'hero';
}

export function findPreviewSectionElement(
  root: ParentNode,
  sectionId: EditorPreviewSectionId
): HTMLElement | null {
  const primary =
    root.querySelector(`[data-section-id="${sectionId}"]`) ||
    root.querySelector(`[data-preview-section="${sectionId}"]`);
  if (primary instanceof HTMLElement) return primary;

  for (const fallback of SECTION_FALLBACKS) {
    if (fallback === sectionId) continue;
    const el =
      root.querySelector(`[data-section-id="${fallback}"]`) ||
      root.querySelector(`[data-preview-section="${fallback}"]`);
    if (el instanceof HTMLElement) return el;
  }
  return null;
}

export const PREVIEW_SECTION_ATTR = 'data-section-id';
