/**
 * Gallery presentation resolver — visualTemplateId + galleryDisplayMode.
 * Storage SSOT remains dataJson.galleryDisplayMode (SLIDE | GRID_EXPAND only).
 */
import type { GalleryDisplayMode } from '@/src/invitation/galleryDisplay';
import { normalizeGalleryDisplayMode } from '@/src/invitation/galleryDisplay';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { isVisualTemplateId } from '@/src/templates/visualTemplate/ids';

export type VisualGalleryPresentation =
  | 'classic'
  | 'editorial'
  | 'garden'
  | 'night'
  | 'clean'
  | 'festive'
  | 'culture';

export type ResolvedVisualGallery = {
  presentation: VisualGalleryPresentation;
  displayMode: GalleryDisplayMode;
  /** Classic uses shared InvitationGallerySection; others use template layouts. */
  usesClassicShared: boolean;
};

const PRESENTATION_BY_ID: Record<VisualTemplateId, VisualGalleryPresentation> = {
  WEDDING_01_CLASSIC: 'classic',
  GENERAL_01_CLASSIC: 'classic',
  WEDDING_04_EDITORIAL: 'editorial',
  WEDDING_05_GARDEN: 'garden',
  WEDDING_06_NIGHT: 'night',
  GENERAL_04_CLEAN: 'clean',
  GENERAL_05_FESTIVE: 'festive',
  GENERAL_06_CULTURE: 'culture',
};

/** Template Preview fixture — representative mode only (customers may pick either). */
export function getPreviewFixtureGalleryMode(visualTemplateId: VisualTemplateId): GalleryDisplayMode {
  switch (visualTemplateId) {
    case 'WEDDING_06_NIGHT':
    case 'GENERAL_06_CULTURE':
    case 'GENERAL_01_CLASSIC':
      return 'SLIDE';
    default:
      return 'GRID_EXPAND';
  }
}

export function resolveVisualGalleryPresentation(
  visualTemplateId: unknown,
  galleryDisplayMode: unknown
): ResolvedVisualGallery {
  const displayMode = normalizeGalleryDisplayMode(galleryDisplayMode);
  const id = isVisualTemplateId(visualTemplateId) ? visualTemplateId : null;
  const presentation = id ? PRESENTATION_BY_ID[id] : 'classic';
  return {
    presentation,
    displayMode,
    usesClassicShared: presentation === 'classic',
  };
}
