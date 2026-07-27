'use client';

import { useEffect, useRef, type RefObject } from 'react';
import styles from './UnifiedStepperNav.module.css';

export type UnifiedStepItem = {
  id: number;
  title: string;
};

type UnifiedStepperNavProps = {
  steps: UnifiedStepItem[];
  currentStep: number;
  onStepSelect: (stepId: number) => void;
  orientation?: 'horizontal' | 'vertical';
  /** Figma Make: 1-based display (default true). Internal id remains 0-based index. */
  oneBasedLabels?: boolean;
};

export default function UnifiedStepperNav({
  steps,
  currentStep,
  onStepSelect,
  orientation = 'horizontal',
  oneBasedLabels = true,
}: UnifiedStepperNavProps) {
  const scrollerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isHorizontal = orientation === 'horizontal';

  useEffect(() => {
    if (!isHorizontal) return;
    const scroller = scrollerRef.current;
    const activeIndex = steps.findIndex((step) => step.id === currentStep);
    const activeEl = itemRefs.current[activeIndex];
    if (!scroller || !activeEl || activeIndex < 0) return;

    if (activeIndex === 0) {
      scroller.scrollLeft = 0;
      return;
    }

    const maxIndex = steps.length - 1;
    activeEl.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: activeIndex === maxIndex ? 'end' : 'nearest',
    });
  }, [currentStep, isHorizontal, steps]);

  return (
    <nav
      ref={scrollerRef as RefObject<HTMLElement>}
      className={`${styles.stepper} ${isHorizontal ? styles.horizontal : styles.vertical}`}
      data-testid={isHorizontal ? 'unified-stepper-horizontal' : 'unified-stepper-vertical'}
    >
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < steps.findIndex((s) => s.id === currentStep);
        const label = oneBasedLabels ? index + 1 : step.id;
        return (
          <button
            key={step.id}
            type="button"
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`${styles.item} ${isActive ? styles.itemActive : ''} ${
              isCompleted ? styles.itemCompleted : ''
            }`}
            onClick={() => onStepSelect(step.id)}
            data-testid={`stepper-item-${step.id}`}
          >
            <span className={styles.index} aria-hidden>
              {isCompleted ? '✓' : label}
            </span>
            <span className={styles.title}>{step.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
