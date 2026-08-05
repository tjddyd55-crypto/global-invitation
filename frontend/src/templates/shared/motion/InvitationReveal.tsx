'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './InvitationReveal.css';

type InvitationRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms */
  delayMs?: number;
  variant?: InvitationRevealVariant;
  once?: boolean;
};

export type InvitationRevealVariant =
  | 'rise'
  | 'fade'
  | 'blur'
  | 'wipe'
  | 'mask'
  | 'draw'
  | 'slideLeft'
  | 'slideRight'
  | 'zoom';

/**
 * In-view once reveal. Honors prefers-reduced-motion (shows final state immediately).
 * Does not block pointer events / buttons.
 */
export function InvitationReveal({
  children,
  className,
  delayMs = 0,
  variant = 'rise',
  once = true,
}: InvitationRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const style: CSSProperties = {
    transitionDelay: visible ? `${delayMs}ms` : '0ms',
  };

  return (
    <div
      ref={ref}
      className={`gi-reveal gi-reveal--${variant}${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      data-reveal={variant}
    >
      {children}
    </div>
  );
}
