'use client';

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
};

export default function UnifiedStepperNav({
  steps,
  currentStep,
  onStepSelect,
  orientation = 'horizontal',
}: UnifiedStepperNavProps) {
  return (
    <nav className={`${styles.stepper} ${orientation === 'vertical' ? styles.vertical : styles.horizontal}`}>
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        return (
          <button
            key={step.id}
            type="button"
            className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
            onClick={() => onStepSelect(step.id)}
          >
            <span className={styles.index}>{step.id}</span>
            <span className={styles.title}>{step.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
