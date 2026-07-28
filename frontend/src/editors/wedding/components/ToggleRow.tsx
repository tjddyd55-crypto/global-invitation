'use client';

import styles from '../weddingEditor.module.css';

type ToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId?: string;
};

export default function ToggleRow({ label, description, checked, onChange, testId }: ToggleRowProps) {
  return (
    <label className={styles.toggleRow} data-testid={testId}>
      <span className={styles.toggleText}>
        <span className={styles.toggleLabel}>{label}</span>
        {description && <span className={styles.toggleDescription}>{description}</span>}
      </span>
      <span className={styles.toggleControl}>
        <input
          className={styles.toggleInput}
          type="checkbox"
          checked={checked}
          data-testid={testId ? `${testId}-input` : undefined}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.toggleSlider} aria-hidden="true" />
      </span>
    </label>
  );
}
