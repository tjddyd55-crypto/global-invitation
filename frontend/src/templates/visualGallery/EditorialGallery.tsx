'use client';

import { useCallback, useState, type SyntheticEvent } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import GalleryCarousel from '@/src/templates/shared/GalleryCarousel';
import GalleryExpandControls from './GalleryExpandControls';
import {
  computeImageAspectRatio,
  resolveEditorialGalleryObjectFit,
  resolveEditorialGallerySlot,
  type EditorialGallerySlot,
  type GalleryObjectFit,
} from './editorialGallerySlots';
import { useExpandableGallery } from './useExpandableGallery';
import type { TemplateGalleryPresentationProps } from './types';
import styles from './EditorialGallery.module.css';

const SLOT_CLASS: Record<EditorialGallerySlot, string> = {
  WIDE: styles.slotWide,
  PORTRAIT_LEFT: styles.slotPortraitLeft,
  PORTRAIT_RIGHT: styles.slotPortraitRight,
  TALL_LEFT: styles.slotTallLeft,
  MEDIUM_RIGHT: styles.slotMediumRight,
  WIDE_SECONDARY: styles.slotWideSecondary,
};

/**
 * WEDDING_04_EDITORIAL — fixed-slot collage (GRID_EXPAND) / magazine slide (SLIDE).
 * GRID_EXPAND: slot size is template-owned; object-fit never changes slot geometry.
 */
export default function EditorialGallery({
  items,
  displayMode,
  sectionLabel = 'GALLERY',
  labelClassName,
  hintText = '밀어서 더 많은 사진 보기',
  className,
  lockBodyScroll = true,
}: TemplateGalleryPresentationProps) {
  const expand = useExpandableGallery(items);
  const [fitByUrl, setFitByUrl] = useState<Record<string, GalleryObjectFit>>({});

  const onImageLoad = useCallback((url: string, event: SyntheticEvent<HTMLImageElement>, preferCover: boolean) => {
    if (preferCover) {
      setFitByUrl((prev) => (prev[url] === 'cover' ? prev : { ...prev, [url]: 'cover' }));
      return;
    }
    const img = event.currentTarget;
    const ratio = computeImageAspectRatio(img.naturalWidth, img.naturalHeight);
    const next = resolveEditorialGalleryObjectFit(ratio);
    setFitByUrl((prev) => (prev[url] === next ? prev : { ...prev, [url]: next }));
  }, []);

  if (!items.length) return null;

  if (displayMode === 'SLIDE') {
    return (
      <GalleryCarousel
        items={items}
        sectionLabel={sectionLabel}
        hintText={hintText}
        className={`${styles.slideShell} ${className ?? ''}`.trim()}
        tone="wedding"
        presentation="editorial"
      />
    );
  }

  const { sectionRef, gridId, shown, visiblePool, absoluteIndexOf, setOpenIndex, markFailed } = expand;
  const shownCount = shown.length;

  return (
    <section
      ref={sectionRef}
      className={`visualTemplateEditorial ${styles.section} ${className ?? ''}`.trim()}
      aria-label="Gallery"
      data-testid="public-gallery"
      data-gallery-layout="GRID_EXPAND"
      data-gallery-presentation="editorial"
      data-section-id="gallery"
      data-preview-section="gallery"
      data-gallery-count={visiblePool.length}
    >
      {sectionLabel ? <p className={labelClassName}>{sectionLabel}</p> : null}
      <div id={gridId} className={styles.grid} data-testid="gallery-grid" data-editorial-grid="fixed-slots">
        {shown.map((item, index) => {
          const slot = resolveEditorialGallerySlot(index, shownCount);
          const fit = fitByUrl[item.url] ?? 'cover';
          const label = item.alt?.trim() || `갤러리 이미지 ${absoluteIndexOf(item, index) + 1}`;
          return (
            <button
              key={item.id || item.url}
              type="button"
              className={`${styles.item} ${SLOT_CLASS[slot]}`.trim()}
              data-editorial-slot={slot}
              data-testid={`gallery-grid-thumb-${index}`}
              onClick={() => setOpenIndex(absoluteIndexOf(item, index))}
              aria-label={`${label} 크게 보기`}
            >
              <span className={styles.media}>
                <ImageWithFallback
                  className={`${styles.image} ${fit === 'contain' ? styles.fitContain : styles.fitCover}`}
                  src={item.url}
                  alt={item.alt}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  style={
                    item.objectPosition
                      ? { objectPosition: item.objectPosition }
                      : undefined
                  }
                  onLoad={(event) => onImageLoad(item.url, event, Boolean(item.objectPosition))}
                  onFailed={() => markFailed(item.url)}
                />
              </span>
            </button>
          );
        })}
      </div>
      <p className={styles.galleryCount}>{`${visiblePool.length} PHOTOS`}</p>
      <GalleryExpandControls state={expand} items={visiblePool} lockBodyScroll={lockBodyScroll} />
    </section>
  );
}
