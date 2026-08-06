'use client';

import GalleryChevronIcon from '@/src/templates/shared/GalleryChevronIcon';
import GalleryLightboxDialog from '@/src/templates/shared/GalleryLightboxDialog';
import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';
import type { useExpandableGallery } from './useExpandableGallery';
import styles from './galleryExpandControls.module.css';

type ExpandState = ReturnType<typeof useExpandableGallery>;

type GalleryExpandControlsProps = {
  state: ExpandState;
  items: InvitationGalleryItem[];
  lockBodyScroll?: boolean;
  /** Optional tone class for chevron button (template CSS). */
  expandClassName?: string;
  chevronClassName?: string;
  chevronUpClassName?: string;
};

/**
 * Shared expand toggle + lightbox for template-specific GRID layouts.
 */
export default function GalleryExpandControls({
  state,
  items,
  lockBodyScroll = true,
  expandClassName,
  chevronClassName,
  chevronUpClassName,
}: GalleryExpandControlsProps) {
  const {
    gridId,
    canExpand,
    expanded,
    toggleExpand,
    openIndex,
    setOpenIndex,
    visiblePool,
  } = state;

  return (
    <>
      {canExpand ? (
        <button
          type="button"
          className={expandClassName ?? styles.expandButton}
          aria-expanded={expanded}
          aria-controls={gridId}
          aria-label={expanded ? '사진 접기' : '전체 사진 보기'}
          data-testid="gallery-expand-toggle"
          onClick={toggleExpand}
        >
          <GalleryChevronIcon
            className={`${chevronClassName ?? styles.chevron} ${
              expanded ? chevronUpClassName ?? styles.chevronUp : ''
            }`.trim()}
            data-testid="gallery-expand-chevron"
            data-direction={expanded ? 'up' : 'down'}
          />
        </button>
      ) : null}
      <GalleryLightboxDialog
        items={items.length ? items : visiblePool}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onChangeIndex={setOpenIndex}
        lockBodyScroll={lockBodyScroll}
      />
    </>
  );
}
