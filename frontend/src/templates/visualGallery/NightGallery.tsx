'use client';

import { useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import GalleryLightboxDialog from '@/src/templates/shared/GalleryLightboxDialog';
import GalleryExpandControls from './GalleryExpandControls';
import { useExpandableGallery } from './useExpandableGallery';
import type { TemplateGalleryPresentationProps } from './types';
import styles from './NightGallery.module.css';

/** WEDDING_06_NIGHT — film snap SLIDE / cinematic contact GRID_EXPAND */
export default function NightGallery({
  items,
  displayMode,
  sectionLabel = 'FILM',
  labelClassName,
  hintText = '밀어서 더 많은 사진 보기',
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
        data-gallery-presentation="night"
        data-section-id="gallery"
        data-preview-section="gallery"
        data-gallery-count={items.length}
      >
        {sectionLabel ? (
          <p className={`${labelClassName ?? ''} ${styles.sectionLabelPad}`.trim()}>{sectionLabel}</p>
        ) : null}
        <div className={styles.filmStrip} role="list">
          {items.map((item, index) => (
            <button
              key={item.id || item.url}
              type="button"
              className={styles.filmCell}
              role="listitem"
              onClick={() => setSlideLightbox(index)}
              aria-label={`${index + 1}번째 사진 크게 보기`}
            >
              <ImageWithFallback
                className={styles.filmImage}
                src={item.url}
                alt={item.alt}
                loading={index < 2 ? 'eager' : 'lazy'}
              />
            </button>
          ))}
        </div>
        {hintText ? <p className={styles.filmHint}>{hintText}</p> : null}
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
      data-gallery-presentation="night"
      data-section-id="gallery"
      data-preview-section="gallery"
      data-gallery-count={visiblePool.length}
    >
      {sectionLabel ? (
        <p className={`${labelClassName ?? ''} ${styles.sectionLabelPad}`.trim()}>{sectionLabel}</p>
      ) : null}
      <div id={gridId} className={styles.cinematic} data-testid="gallery-grid">
        {shown.map((item, index) => (
          <button
            key={item.id || item.url}
            type="button"
            className={styles.cinematicCell}
            data-testid={`gallery-grid-thumb-${index}`}
            onClick={() => setOpenIndex(absoluteIndexOf(item, index))}
            aria-label={`${item.alt || '사진'} 크게 보기`}
          >
            <ImageWithFallback
              className={styles.cinematicImage}
              src={item.url}
              alt={item.alt}
              loading={index < 3 ? 'eager' : 'lazy'}
              onFailed={() => markFailed(item.url)}
            />
          </button>
        ))}
      </div>
      <div className={styles.padExpand}>
        <GalleryExpandControls state={expand} items={visiblePool} lockBodyScroll={lockBodyScroll} />
      </div>
    </section>
  );
}
