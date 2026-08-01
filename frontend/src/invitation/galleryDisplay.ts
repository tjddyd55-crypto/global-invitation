/**
 * Gallery display mode SSOT — Editor / Preview / Public 공통.
 * Field: dataJson.galleryDisplayMode
 * Legacy missing/invalid → SLIDE (no forced rewrite).
 */

import {
  getInvitationGalleryItems,
  type InvitationGalleryItem,
} from './galleryItems';

export const GALLERY_DISPLAY_MODES = ['SLIDE', 'GRID_EXPAND'] as const;

export type GalleryDisplayMode = (typeof GALLERY_DISPLAY_MODES)[number];

export const GALLERY_GRID_INITIAL_VISIBLE_COUNT = 9;

export type InvitationGallerySettings = {
  images: InvitationGalleryItem[];
  displayMode: GalleryDisplayMode;
  initialVisibleCount: number;
  canExpand: boolean;
  title?: string;
};

export function normalizeGalleryDisplayMode(value: unknown): GalleryDisplayMode {
  if (value === 'GRID_EXPAND' || value === 'SLIDE') return value;
  return 'SLIDE';
}

export function getInvitationGallerySettings(
  invitationData: unknown,
  options?: { alt?: string; title?: string }
): InvitationGallerySettings {
  const data =
    invitationData && typeof invitationData === 'object'
      ? (invitationData as Record<string, unknown>)
      : null;
  const images = getInvitationGalleryItems(data, { alt: options?.alt });
  const displayMode = normalizeGalleryDisplayMode(data?.galleryDisplayMode);
  const initialVisibleCount = GALLERY_GRID_INITIAL_VISIBLE_COUNT;
  return {
    images,
    displayMode,
    initialVisibleCount,
    canExpand: displayMode === 'GRID_EXPAND' && images.length > initialVisibleCount,
    title: options?.title,
  };
}
