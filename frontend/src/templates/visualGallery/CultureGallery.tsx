'use client';

import { useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import GalleryLightboxDialog from '@/src/templates/shared/GalleryLightboxDialog';
import GalleryExpandControls from './GalleryExpandControls';
import { useExpandableGallery } from './useExpandableGallery';
import type { TemplateGalleryPresentationProps } from './types';
import styles from './CultureGallery.module.css';

/** GENERAL_06_CULTURE — poster snap SLIDE / poster grid GRID_EXPAND */
export default function CultureGallery({
  items,
  displayMode,
  sectionLabel = 'ARCHIVE',
  labelClassName,
  hintText = '밀어서 더 많은 작품 보기',
  className,
  lockBodyScroll = true,
}: TemplateGalleryPresentationProps) {
  const [slideLightbox, setSlideLightbox] = useState<number | null>(null);
  const expand = useExpandableGallery(items);

  if (!items.length) return null;

  if (displayMode === 'SLIDE') {
    return (
      <section
        className={`${styles.section} ${className ?? ''}`.trim()}
        aria-label="Gallery"
        data-testid="public-gallery"
        data-gallery-layout="SLIDE"
        data-gallery-presentation="culture"
        data-section-id="gallery"
        data-preview-section="gallery"
        data-gallery-count={items.length}
      >
        {sectionLabel ? <p className={labelClassName}>{sectionLabel}</p> : null}
        <div className={styles.posterStrip} role="list">
          {items.map((item, index) => (
            <button
              key={item.id || item.url}
              type="button"
              className={styles.posterCell}
              role="listitem"
              onClick={() => setSlideLightbox(index)}
              aria-label={`${index + 1}번째 사진 크게 보기`}
            >
              <ImageWithFallback
                className={styles.posterImage}
                src={item.url}
                alt={item.alt}
                loading={index < 2 ? 'eager' : 'lazy'}
              />
            </button>
          ))}
        </div>
        {hintText ? <p className={styles.posterIndex}>{hintText}</p> : null}
        <GalleryLightboxDialog
          items={items}
          openIndex={slideLightbox}
          onClose={() => setSlideLightbox(null)}
          onChangeIndex={setSlideLightbox}
          lockBodyScroll={lockBodyScroll}
        />
      </section>
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
      data-gallery-presentation="culture"
      data-section-id="gallery"
      data-preview-section="gallery"
      data-gallery-count={visiblePool.length}
    >
      {sectionLabel ? <p className={labelClassName}>{sectionLabel}</p> : null}
      <div id={gridId} className={styles.posterGrid} data-testid="gallery-grid">
        {shown.map((item, index) => (
          <button
            key={item.id || item.url}
            type="button"
            className={styles.posterGridCell}
            data-testid={`gallery-grid-thumb-${index}`}
            onClick={() => setOpenIndex(absoluteIndexOf(item, index))}
            aria-label={`${item.alt || '사진'} 크게 보기`}
          >
            <ImageWithFallback
              className={styles.posterImage}
              src={item.url}
              alt={item.alt}
              loading={index < 3 ? 'eager' : 'lazy'}
              onFailed={() => markFailed(item.url)}
            />
          </button>
        ))}
      </div>
      <GalleryExpandControls state={expand} items={visiblePool} lockBodyScroll={lockBodyScroll} />
    </section>
  );
}
