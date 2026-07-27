'use client';

import { useEffect, useRef, useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';
import styles from './GalleryCarousel.module.css';

type GalleryCarouselProps = {
  items: InvitationGalleryItem[];
  sectionLabel?: string;
  hintText?: string;
  className?: string;
  /** GENERAL 등 concept tone — accent만 변경 */
  tone?: 'wedding' | 'general' | 'funeral';
};

const SWIPE_THRESHOLD_PX = 40;

export default function GalleryCarousel({
  items,
  sectionLabel = 'Album',
  hintText = '밀어서 더 많은 이미지 보기',
  className,
  tone = 'wedding',
}: GalleryCarouselProps) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, true>>({});
  const pointerStartX = useRef<number | null>(null);

  const visible = items.filter((item) => item.url && !failed[item.url]);

  useEffect(() => {
    setIndex(0);
  }, [items.map((item) => item.url).join('|')]);

  useEffect(() => {
    if (visible.length === 0) return;
    if (index >= visible.length) setIndex(0);
  }, [index, visible.length]);

  if (visible.length === 0) return null;

  const current = visible[Math.min(index, visible.length - 1)] ?? visible[0];
  const multi = visible.length > 1;

  const goPrev = () => {
    setIndex((prev) => (prev <= 0 ? visible.length - 1 : prev - 1));
  };

  const goNext = () => {
    setIndex((prev) => (prev >= visible.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      className={`${styles.albumSection} ${styles[`tone_${tone}`]} ${className ?? ''}`.trim()}
      aria-label="Gallery"
      data-testid="gallery-carousel"
      data-gallery-count={visible.length}
    >
      {sectionLabel ? <p className={styles.scriptLabel}>{sectionLabel}</p> : null}
      <div
        className={styles.galleryCarousel}
        onPointerDown={(event) => {
          if (!multi) return;
          pointerStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (!multi || pointerStartX.current == null) return;
          const delta = event.clientX - pointerStartX.current;
          pointerStartX.current = null;
          if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
          if (delta < 0) goNext();
          else goPrev();
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        <ImageWithFallback
          key={current.url}
          className={styles.galleryMainImage}
          src={current.url}
          alt={current.alt}
          loading="lazy"
          style={current.objectPosition ? { objectPosition: current.objectPosition } : undefined}
          onFailed={() => {
            setFailed((prev) => ({ ...prev, [current.url]: true }));
            setIndex(0);
          }}
        />
        {multi ? (
          <>
            <button
              type="button"
              className={`${styles.galleryArrow} ${styles.galleryArrowPrev}`}
              aria-label="이전 이미지"
              data-testid="gallery-prev"
              onClick={goPrev}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.galleryArrow} ${styles.galleryArrowNext}`}
              aria-label="다음 이미지"
              data-testid="gallery-next"
              onClick={goNext}
            >
              ›
            </button>
            <div className={styles.galleryCount} data-testid="gallery-count">
              {index + 1} / {visible.length}
            </div>
            {hintText ? <div className={styles.galleryHint}>{hintText}</div> : null}
            <div className={styles.galleryDots} data-testid="gallery-dots">
              {visible.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={i === index ? styles.galleryDotActive : styles.galleryDot}
                  aria-label={`${i + 1}번 이미지`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
