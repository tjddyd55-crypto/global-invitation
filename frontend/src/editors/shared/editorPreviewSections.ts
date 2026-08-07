/**
 * Editor step → Phone Preview section scroll SSOT.
 * DOM index 기반 scroll 금지. data-section-id / data-preview-section 계약.
 */

export type EditorPreviewSectionId =
  | 'basic'
  | 'hero'
  | 'greeting'
  | 'couple'
  | 'schedule'
  | 'gallery'
  | 'location'
  | 'accounts'
  | 'rsvp'
  | 'comments'
  | 'music'
  | 'share'
  | 'deceased'
  | 'organization';

/** editorSteps EditorSectionKey 와 동일 */
export type EditorStepKey =
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

/** Preview frame 상단 padding 아래 정렬용 offset (px) */
export const PREVIEW_SECTION_SCROLL_OFFSET = 12;

const WEDDING_STEP_TO_SECTION: Record<EditorStepKey, EditorPreviewSectionId> = {
  setup: 'hero',
  organization: 'hero',
  message: 'greeting',
  hero: 'hero',
  couple: 'couple',
  schedule: 'schedule',
  gallery: 'gallery',
  location: 'location',
  accounts: 'accounts',
  rsvp: 'rsvp',
  music: 'music',
  share: 'share',
};

/**
 * GENERAL editor step → Preview section.
 * schedule 키는 editor visible step 에 없으며, Preview/Public renderer 전용 섹션이다.
 * (legacy resolve 호출 시 basic 으로 보내 빈 화면을 피한다)
 */
const GENERAL_STEP_TO_SECTION: Record<EditorStepKey, EditorPreviewSectionId> = {
  setup: 'basic',
  organization: 'basic',
  message: 'greeting',
  hero: 'hero',
  couple: 'greeting',
  schedule: 'basic',
  gallery: 'gallery',
  location: 'location',
  accounts: 'accounts',
  rsvp: 'rsvp',
  music: 'music',
  share: 'share',
};

/** ORGANIZATION — branding step scrolls to organization header */
const ORGANIZATION_STEP_TO_SECTION: Record<EditorStepKey, EditorPreviewSectionId> = {
  setup: 'basic',
  organization: 'organization',
  message: 'greeting',
  hero: 'hero',
  couple: 'greeting',
  schedule: 'basic',
  gallery: 'gallery',
  location: 'location',
  accounts: 'accounts',
  rsvp: 'rsvp',
  music: 'music',
  share: 'share',
};

const FUNERAL_STEP_TO_SECTION: Record<EditorStepKey, EditorPreviewSectionId> = {
  setup: 'hero',
  organization: 'hero',
  message: 'greeting',
  hero: 'hero',
  couple: 'deceased',
  schedule: 'schedule',
  gallery: 'location',
  location: 'location',
  accounts: 'accounts',
  rsvp: 'rsvp',
  music: 'music',
  share: 'share',
};

/** 동일 의미의 DOM id 별칭만 허용. 무관한 섹션으로 fallback 금지. */
const SECTION_QUERY_IDS: Record<EditorPreviewSectionId, string[]> = {
  basic: ['basic'],
  hero: ['hero'],
  greeting: ['greeting', 'introduction'],
  couple: ['couple'],
  schedule: ['schedule'],
  gallery: ['gallery'],
  location: ['location'],
  accounts: ['accounts', 'account'],
  rsvp: ['rsvp'],
  comments: ['comments'],
  music: ['music'],
  share: ['share'],
  deceased: ['deceased'],
  organization: ['organization'],
};

export function resolveEditorPreviewSectionId(
  stepKey: string,
  conceptType: 'WEDDING' | 'FUNERAL' | 'GENERAL' | 'ORGANIZATION' = 'WEDDING'
): EditorPreviewSectionId {
  const map =
    conceptType === 'FUNERAL'
      ? FUNERAL_STEP_TO_SECTION
      : conceptType === 'ORGANIZATION'
        ? ORGANIZATION_STEP_TO_SECTION
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
  const candidates = SECTION_QUERY_IDS[sectionId] ?? [sectionId];
  for (const id of candidates) {
    const primary =
      root.querySelector(`[data-section-id="${id}"]`) ||
      root.querySelector(`[data-preview-section="${id}"]`);
    if (primary instanceof HTMLElement) return primary;
  }
  return null;
}

/**
 * Scroll the editor preview container to a section.
 * Uses the preview scroll root — never window.scrollTo.
 */
export function scrollPreviewToSection(
  root: HTMLElement | null | undefined,
  sectionId: EditorPreviewSectionId,
  options?: { behavior?: ScrollBehavior; offsetPx?: number }
): boolean {
  if (!root) return false;
  const target = findPreviewSectionElement(root, sectionId);
  if (!target) return false;
  const offsetPx = options?.offsetPx ?? PREVIEW_SECTION_SCROLL_OFFSET;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const rootRect = root.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop = root.scrollTop + (targetRect.top - rootRect.top) - offsetPx;
  root.scrollTo({
    top: Math.max(0, nextTop),
    behavior: options?.behavior ?? (prefersReducedMotion ? 'auto' : 'smooth'),
  });
  return true;
}

export const PREVIEW_SECTION_ATTR = 'data-section-id';
