'use client';

import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import GalleryCarousel from '@/src/templates/shared/GalleryCarousel';
import GalleryExpandControls from './GalleryExpandControls';
import { useExpandableGallery } from './useExpandableGallery';
import type { TemplateGalleryPresentationProps } from './types';
import styles from './CleanGallery.module.css';

/** GENERAL_04_CLEAN — archive grid / clean slide */
export default function CleanGallery({
  items,
  displayMode,
  sectionLabel = 'GALLERY',
  labelClassName,
  hintText = '밀어서 더 많은 사진 보기',
  className,
  lockBodyScroll = true,
}: TemplateGalleryPresentationProps) {
  const expand = useExpandableGallery(items);

  if (!items.length) return null;

  if (displayMode === 'SLIDE') {
    return (
      <GalleryCarousel
        items={items}
        sectionLabel={sectionLabel}
        hintText={hintText}
        className={`${styles.slideShell} ${className ?? ''}`.trim()}
        tone="general"
        presentation="clean"
      />
    );
  }

  const { sectionRef, gridId, shown, visiblePool, absoluteIndexOf, setOpenIndex, markFailed } = expand;

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${className ?? ''}`.trim()}
      aria-label="Gallery"
      data-testid="public-gallery"
      data-gallery-layout="GRID_EXPAND"
      data-gallery-presentation="clean"
      data-section-id="gallery"
      data-preview-section="gallery"
      data-gallery-count={visiblePool.length}
    >
      {sectionLabel ? <p className={labelClassName}>{sectionLabel}</p> : null}
      <div id={gridId} className={styles.archiveGrid} data-testid="gallery-grid">
        {shown.map((item, index) => (
          <button
            key={item.id || item.url}
            type="button"
            className={styles.archiveCell}
            data-testid={`gallery-grid-thumb-${index}`}
            onClick={() => setOpenIndex(absoluteIndexOf(item, index))}
            aria-label={`${item.alt || '사진'} 크게 보기`}
          >
            <ImageWithFallback
              className={styles.archiveImage}
              src={item.url}
              alt={item.alt}
              loading={index < 4 ? 'eager' : 'lazy'}
              onFailed={() => markFailed(item.url)}
            />
          </button>
        ))}
      </div>
      <GalleryExpandControls state={expand} items={visiblePool} lockBodyScroll={lockBodyScroll} />
    </section>
  );
}
