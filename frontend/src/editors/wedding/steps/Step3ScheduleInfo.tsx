'use client';

import DateTimeLocalField from '@/src/editors/shared/DateTimeLocalField';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorBasic } from '../state/weddingEditor.types';

type Step3ScheduleInfoProps = {
  value: WeddingEditorBasic;
  onChange: (value: Partial<WeddingEditorBasic>) => void;
};

/**
 * FUNERAL 장례 일정 Step (GENERAL은 기본 정보에 통합 — visible step 목록에 없음).
 * Step1 기본 정보와 동일한 WeddingEditorBasic SSOT 를 편집한다 (중복 state 금지).
 */
export default function Step3ScheduleInfo({ value, onChange }: Step3ScheduleInfoProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>일정</h2>
        <p>기본 정보와 동일한 일시·장소를 편집합니다. 한쪽을 바꾸면 즉시 함께 반영됩니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <DateTimeLocalField
          label="행사 날짜/시간"
          value={value.eventDateTime}
          onChange={(next) => onChange({ eventDateTime: next })}
          required
          inputTestId="schedule-datetime-input"
          buttonTestId="schedule-datetime-picker-button"
        />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>장소명</span>
          <input
            type="text"
            value={value.venueName}
            onChange={(event) => onChange({ venueName: event.target.value })}
            placeholder="예: 코엑스 컨퍼런스홀"
            data-testid="schedule-venue-input"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>홀 이름 (선택)</span>
          <input
            type="text"
            value={value.venueDetail ?? ''}
            onChange={(event) => onChange({ venueDetail: event.target.value })}
            placeholder="예: 3층 오디토리움"
            data-testid="schedule-venue-detail-input"
          />
        </label>
      </div>
    </section>
  );
}
