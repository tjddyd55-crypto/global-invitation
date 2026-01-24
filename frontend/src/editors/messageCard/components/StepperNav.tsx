'use client';

import styles from '../messageCardEditor.module.css';

export type MessageCardStep = {
  id: number;
  title: string;
};

type StepperNavProps = {
  steps: MessageCardStep[];
  currentStep: number;
  onStepSelect: (stepId: number) => void;
  variant?: 'vertical' | 'horizontal';
};

export default function StepperNav({
  steps,
  currentStep,
  onStepSelect,
  variant = 'vertical',
}: StepperNavProps) {
  return (
    <nav className={`${styles.stepperNav} ${variant === 'horizontal' ? styles.stepperNavHorizontal : ''}`}>
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        return (
          <button
            key={step.id}
            type="button"
            className={`${styles.stepperItem} ${isActive ? styles.stepperItemActive : ''}`}
            onClick={() => onStepSelect(step.id)}
          >
            <span className={styles.stepperIndex}>{step.id}</span>
            <span className={styles.stepperTitle}>{step.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
