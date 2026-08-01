'use client';

import { useRef } from 'react';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorBasic } from '../state/weddingEditor.types';

type Step3ScheduleInfoProps = {
  value: WeddingEditorBasic;
  onChange: (value: Partial<WeddingEditorBasic>) => void;
};

/**
 * GENERAL/FUNERAL 일정 입력.
 * native datetime-local + showPicker(지원 시)로 달력·시간 UI를 연다.
 */
export default function Step3ScheduleInfo({ value, onChange }: Step3ScheduleInfoProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDateTimePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    const picker = input as HTMLInputElement & { showPicker?: () => void };
    try {
      if (typeof picker.showPicker === 'function') {
        picker.showPicker();
        return;
      }
    } catch {
      // showPicker 는 user-gesture / insecure context 에서 throw 가능
    }
    input.focus();
    input.click();
  };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>일정</h2>
        <p>행사 일시와 장소를 입력합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>행사 날짜/시간</span>
          <div className={styles.dateTimeFieldRow}>
            <input
              ref={dateInputRef}
              type="datetime-local"
              value={value.eventDateTime}
              onChange={(event) => onChange({ eventDateTime: event.target.value })}
              onClick={openDateTimePicker}
              required
              data-testid="schedule-datetime-input"
            />
            <button
              type="button"
              className={styles.dateTimePickerButton}
              onClick={openDateTimePicker}
              aria-label="날짜와 시간 선택"
              data-testid="schedule-datetime-picker-button"
            >
              달력
            </button>
          </div>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>장소명</span>
          <input
            type="text"
            value={value.venueName}
            onChange={(event) => onChange({ venueName: event.target.value })}
            placeholder="예: 코엑스 컨퍼런스홀"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>상세 장소 (선택)</span>
          <input
            type="text"
            value={value.venueDetail ?? ''}
            onChange={(event) => onChange({ venueDetail: event.target.value })}
            placeholder="예: 3층 오디토리움"
          />
        </label>
      </div>
    </section>
  );
}
