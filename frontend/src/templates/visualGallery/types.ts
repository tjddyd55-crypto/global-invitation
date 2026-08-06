import type { GalleryDisplayMode } from '@/src/invitation/galleryDisplay';
import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';

export type TemplateGalleryPresentationProps = {
  items: InvitationGalleryItem[];
  displayMode: GalleryDisplayMode;
  sectionLabel?: string;
  /** Template CSS module class for section eyebrow (keeps typography SSOT in renderer). */
  labelClassName?: string;
  hintText?: string;
  className?: string;
  lockBodyScroll?: boolean;
};
