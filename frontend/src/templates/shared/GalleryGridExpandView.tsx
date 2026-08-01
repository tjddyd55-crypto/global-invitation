'use client';

import { useEffect, useId, useRef, useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';
import { GALLERY_GRID_INITIAL_VISIBLE_COUNT } from '@/src/invitation/galleryDisplay';
import GalleryLightboxDialog from './GalleryLightboxDialog';
import styles from './GalleryGridExpandView.module.css';

type GalleryGridExpandViewProps = {
  items: InvitationGalleryItem[];
  initialVisibleCount?: number;
  sectionLabel?: string;
  className?: string;
  tone?: 'wedding' | 'general' | 'funeral';
  lockBodyScroll?: boolean;
};

export default function GalleryGridExpandView({
  items,
  initialVisibleCount = GALLERY_GRID_INITIAL_VISIBLE_COUNT,
  sectionLabel = 'Album',
  className,
  tone = 'wedding',
  lockBodyScroll = true,
}: GalleryGridExpandViewProps) {
  const gridId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState<Record<string, true>>({});

  const visiblePool = items.filter((item) => item.url && !failed[item.url]);
  const canExpand = visiblePool.length > initialVisibleCount;
  const shown = expanded || !canExpand ? visiblePool : visiblePool.slice(0, initialVisibleCount);

  useEffect(() => {
    setExpanded(false);
    setOpenIndex(null);
  }, [items.map((item) => item.url).join('|')]);

  if (visiblePool.length === 0) return null;

  const toggleExpand = () => {
    if (!canExpand) return;
    if (expanded) {
      setExpanded(false);
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      return;
    }
    setExpanded(true);
  };

  return (
    <section
      ref={sectionRef}
      className={`${styles.albumSection} ${styles[`tone_${tone}`]} ${className ?? ''}`.trim()}
      aria-label="Gallery"
      data-testid="public-gallery"
      data-gallery-layout="GRID_EXPAND"
      data-section-id="gallery"
      data-preview-section="gallery"
      data-gallery-count={visiblePool.length}
    >
      {sectionLabel ? <p className={styles.scriptLabel}>{sectionLabel}</p> : null}
      <div id={gridId} className={styles.grid} data-testid="gallery-grid">
        {shown.map((item, index) => {
          const absoluteIndex = visiblePool.findIndex((candidate) => candidate.url === item.url);
          return (
            <button
              key={item.id || item.url}
              type="button"
              className={styles.thumbButton}
              aria-label={`${item.alt || '사진'} 크게 보기`}
              data-testid={`gallery-grid-thumb-${index}`}
              onClick={() => setOpenIndex(absoluteIndex >= 0 ? absoluteIndex : index)}
            >
              <ImageWithFallback
                className={styles.thumbImage}
                src={item.url}
                alt={item.alt}
                loading="lazy"
                onFailed={() => setFailed((prev) => ({ ...prev, [item.url]: true }))}
              />
            </button>
          );
        })}
      </div>
      {canExpand ? (
        <button
          type="button"
          className={styles.expandButton}
          aria-expanded={expanded}
          aria-controls={gridId}
          aria-label={expanded ? '사진 접기' : '전체 사진 보기'}
          data-testid="gallery-expand-toggle"
          onClick={toggleExpand}
        >
          <span className={styles.chevron} aria-hidden>
            {expanded ? '⌃' : '⌄'}
          </span>
        </button>
      ) : null}
      <GalleryLightboxDialog
        items={visiblePool}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onChangeIndex={setOpenIndex}
        lockBodyScroll={lockBodyScroll}
      />
    </section>
  );
}
