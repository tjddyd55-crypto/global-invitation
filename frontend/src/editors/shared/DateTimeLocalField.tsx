'use client';

import { useRef } from 'react';
import styles from '../wedding/weddingEditor.module.css';

type DateTimeLocalFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inputTestId?: string;
  buttonTestId?: string;
};

/**
 * datetime-local + showPicker(지원 시) 공용 입력.
 * Step1 기본 정보 / 일정 Step 이 동일 UX·동일 state 를 쓰도록 한다.
 */
export default function DateTimeLocalField({
  label,
  value,
  onChange,
  required,
  inputTestId = 'schedule-datetime-input',
  buttonTestId = 'schedule-datetime-picker-button',
}: DateTimeLocalFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    const picker = input as HTMLInputElement & { showPicker?: () => void };
    try {
      if (typeof picker.showPicker === 'function') {
        picker.showPicker();
        return;
      }
    } catch {
      // user-gesture / insecure context
    }
    input.focus();
    input.click();
  };

  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.dateTimeFieldRow}>
        <input
          ref={inputRef}
          type="datetime-local"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onClick={openPicker}
          required={required}
          data-testid={inputTestId}
        />
        <button
          type="button"
          className={styles.dateTimePickerButton}
          onClick={openPicker}
          aria-label="날짜와 시간 선택"
          data-testid={buttonTestId}
        >
          달력
        </button>
      </div>
    </label>
  );
}
