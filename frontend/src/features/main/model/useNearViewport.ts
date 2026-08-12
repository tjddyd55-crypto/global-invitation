'use client';

import { useEffect, useRef, useState } from 'react';

export function useNearViewport(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [isNear, setIsNear] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setIsNear(true);
        observer.disconnect();
      },
      { rootMargin: '240px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return { ref, isNear };
}
