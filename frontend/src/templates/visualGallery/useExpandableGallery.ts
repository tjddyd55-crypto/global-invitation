'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';
import { GALLERY_GRID_INITIAL_VISIBLE_COUNT } from '@/src/invitation/galleryDisplay';

/**
 * Shared expand / lightbox / failed-image state for template GRID_EXPAND layouts.
 */
export function useExpandableGallery(
  items: InvitationGalleryItem[],
  initialVisibleCount = GALLERY_GRID_INITIAL_VISIBLE_COUNT
) {
  const gridId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState<Record<string, true>>({});

  const itemKey = items.map((item) => item.url).join('|');

  useEffect(() => {
    setExpanded(false);
    setOpenIndex(null);
    setFailed({});
  }, [itemKey]);

  const visiblePool = items.filter((item) => item.url && !failed[item.url]);
  const canExpand = visiblePool.length > initialVisibleCount;
  const shown = expanded || !canExpand ? visiblePool : visiblePool.slice(0, initialVisibleCount);

  const markFailed = (url: string) => {
    setFailed((prev) => ({ ...prev, [url]: true }));
  };

  const absoluteIndexOf = (item: InvitationGalleryItem, fallback: number) => {
    const found = visiblePool.findIndex((candidate) => candidate.url === item.url);
    return found >= 0 ? found : fallback;
  };

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

  return {
    gridId,
    sectionRef,
    visiblePool,
    shown,
    canExpand,
    expanded,
    toggleExpand,
    openIndex,
    setOpenIndex,
    markFailed,
    absoluteIndexOf,
  };
}
