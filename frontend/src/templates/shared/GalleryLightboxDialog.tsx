'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';
import styles from './GalleryLightboxDialog.module.css';

type GalleryLightboxDialogProps = {
  items: InvitationGalleryItem[];
  openIndex: number | null;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
  /** When true, lock document body scroll (public page). Preview should pass false. */
  lockBodyScroll?: boolean;
};

export default function GalleryLightboxDialog({
  items,
  openIndex,
  onClose,
  onChangeIndex,
  lockBodyScroll = true,
}: GalleryLightboxDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);
  const open = openIndex != null && openIndex >= 0 && openIndex < items.length;
  const current = open ? items[openIndex] : null;
  const total = items.length;

  const goPrev = useCallback(() => {
    if (total <= 0 || openIndex == null) return;
    onChangeIndex(openIndex <= 0 ? total - 1 : openIndex - 1);
  }, [onChangeIndex, openIndex, total]);

  const goNext = useCallback(() => {
    if (total <= 0 || openIndex == null) return;
    onChangeIndex(openIndex >= total - 1 ? 0 : openIndex + 1);
  }, [onChangeIndex, openIndex, total]);

  useEffect(() => {
    setFailed(false);
  }, [openIndex, current?.url]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose, open]);

  useEffect(() => {
    if (!open || !lockBodyScroll || typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [lockBodyScroll, open]);

  if (!open || !current) return null;

  const showDots = total > 0 && total <= 10;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="gallery-lightbox"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <p id={titleId} className={styles.srOnly}>
        갤러리 사진 보기
      </p>
      <button
        ref={closeRef}
        type="button"
        className={styles.close}
        aria-label="닫기"
        data-testid="gallery-lightbox-close"
        onClick={onClose}
      >
        ×
      </button>
      {total > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.nav} ${styles.navPrev}`}
            aria-label="이전 사진"
            data-testid="gallery-lightbox-prev"
            onClick={goPrev}
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.nav} ${styles.navNext}`}
            aria-label="다음 사진"
            data-testid="gallery-lightbox-next"
            onClick={goNext}
          >
            ›
          </button>
        </>
      ) : null}
      <div className={styles.stage}>
        {failed ? (
          <p className={styles.error} data-testid="gallery-lightbox-error">
            사진을 불러오지 못했습니다.
          </p>
        ) : (
          <ImageWithFallback
            key={current.url}
            className={styles.image}
            src={current.url}
            alt={current.alt}
            loading="eager"
            onFailed={() => setFailed(true)}
          />
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.counter} data-testid="gallery-lightbox-counter">
          {openIndex + 1} / {total}
        </div>
        {showDots ? (
          <div className={styles.dots} data-testid="gallery-lightbox-dots">
            {items.map((item, index) => (
              <button
                key={item.id || item.url}
                type="button"
                className={`${styles.dot} ${index === openIndex ? styles.dotActive : ''}`.trim()}
                aria-label={`${index + 1}번째 사진`}
                aria-current={index === openIndex}
                onClick={() => onChangeIndex(index)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
