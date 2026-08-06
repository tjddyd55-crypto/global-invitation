'use client';

import type { GalleryDisplayMode } from '@/src/invitation/galleryDisplay';
import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';
import InvitationGallerySection from '@/src/templates/shared/InvitationGallerySection';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import CleanGallery from './CleanGallery';
import CultureGallery from './CultureGallery';
import EditorialGallery from './EditorialGallery';
import FestiveGallery from './FestiveGallery';
import GardenGallery from './GardenGallery';
import NightGallery from './NightGallery';
import { resolveVisualGalleryPresentation } from './resolveVisualGalleryPresentation';

export type VisualTemplateGalleryProps = {
  visualTemplateId: VisualTemplateId | string | null | undefined;
  items: InvitationGalleryItem[];
  displayMode?: GalleryDisplayMode | string | null;
  sectionLabel?: string;
  labelClassName?: string;
  hintText?: string;
  className?: string;
  lockBodyScroll?: boolean;
  tone?: 'wedding' | 'general' | 'funeral';
};

/**
 * Single gallery host for Template Preview / Editor Preview / Public.
 * Presentation = visualTemplateId + galleryDisplayMode (no new storage fields).
 */
export default function VisualTemplateGallery({
  visualTemplateId,
  items,
  displayMode,
  sectionLabel,
  labelClassName,
  hintText,
  className,
  lockBodyScroll = true,
  tone = 'wedding',
}: VisualTemplateGalleryProps) {
  if (!items.length) return null;

  const resolved = resolveVisualGalleryPresentation(visualTemplateId, displayMode);
  const mode = resolved.displayMode;
  const shared = {
    items,
    displayMode: mode,
    sectionLabel,
    labelClassName,
    hintText,
    className,
    lockBodyScroll,
  };

  if (resolved.usesClassicShared) {
    return (
      <InvitationGallerySection
        items={items}
        displayMode={mode}
        sectionLabel={sectionLabel}
        hintText={hintText}
        className={className}
        tone={tone}
        lockBodyScroll={lockBodyScroll}
      />
    );
  }

  switch (resolved.presentation) {
    case 'editorial':
      return <EditorialGallery {...shared} />;
    case 'garden':
      return <GardenGallery {...shared} />;
    case 'night':
      return <NightGallery {...shared} />;
    case 'clean':
      return <CleanGallery {...shared} />;
    case 'festive':
      return <FestiveGallery {...shared} />;
    case 'culture':
      return <CultureGallery {...shared} />;
    default:
      return (
        <InvitationGallerySection
          items={items}
          displayMode={mode}
          sectionLabel={sectionLabel}
          hintText={hintText}
          className={className}
          tone={tone}
          lockBodyScroll={lockBodyScroll}
        />
      );
  }
}
