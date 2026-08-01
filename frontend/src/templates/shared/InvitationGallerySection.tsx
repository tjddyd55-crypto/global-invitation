'use client';

import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';
import type { GalleryDisplayMode } from '@/src/invitation/galleryDisplay';
import GalleryCarousel from './GalleryCarousel';
import GalleryGridExpandView from './GalleryGridExpandView';

type InvitationGallerySectionProps = {
  items: InvitationGalleryItem[];
  displayMode?: GalleryDisplayMode;
  sectionLabel?: string;
  hintText?: string;
  className?: string;
  tone?: 'wedding' | 'general' | 'funeral';
  /** Preview shell should disable document body lock */
  lockBodyScroll?: boolean;
};

/**
 * Shared gallery renderer — Preview / Public 공통.
 * displayMode만 분기하고 images 배열은 공유한다.
 */
export default function InvitationGallerySection({
  items,
  displayMode = 'SLIDE',
  sectionLabel,
  hintText,
  className,
  tone = 'wedding',
  lockBodyScroll = true,
}: InvitationGallerySectionProps) {
  if (!items.length) return null;

  if (displayMode === 'GRID_EXPAND') {
    return (
      <GalleryGridExpandView
        items={items}
        sectionLabel={sectionLabel}
        className={className}
        tone={tone}
        lockBodyScroll={lockBodyScroll}
      />
    );
  }

  return (
    <GalleryCarousel
      items={items}
      sectionLabel={sectionLabel}
      hintText={hintText}
      className={className}
      tone={tone}
    />
  );
}
