'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorBasic } from '../state/weddingEditor.types';

type Step3ScheduleInfoProps = {
  value: WeddingEditorBasic;
  onChange: (value: Partial<WeddingEditorBasic>) => void;
};

export default function Step3ScheduleInfo({ value, onChange }: Step3ScheduleInfoProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>일정</h2>
        <p>행사 일시와 장소를 입력합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>행사 날짜/시간</span>
          <input
            type="datetime-local"
            value={value.eventDateTime}
            onChange={(event) => onChange({ eventDateTime: event.target.value })}
            required
          />
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
