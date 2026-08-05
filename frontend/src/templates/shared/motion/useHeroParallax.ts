'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';

/**
 * Hero 이미지 약한 패럴랙스.
 *
 * 레이아웃을 건드리지 않도록 CSS 변수(`--gi-parallax`)만 갱신하고,
 * 실제 이동은 각 템플릿 CSS 가 결정한다. reduced-motion 이면 아무것도 하지 않는다.
 *
 * @param strength 스크롤 대비 이동 비율 (0.1 = 스크롤 10%)
 * @param maxShiftPx 최대 이동량 — 이미지가 프레임 밖으로 비지 않도록 제한
 */
export function useHeroParallax<T extends HTMLElement>(
  strength = 0.12,
  maxShiftPx = 36
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const shift = Math.max(-maxShiftPx, Math.min(maxShiftPx, -rect.top * strength));
      node.style.setProperty('--gi-parallax', `${shift.toFixed(1)}px`);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [strength, maxShiftPx]);

  return ref;
}
