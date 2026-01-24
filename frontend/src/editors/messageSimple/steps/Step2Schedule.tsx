'use client';

import styles from '../messageSimpleEditor.module.css';
import type { MessageSimpleSchedule } from '@/src/models/messageSimple';

type Step2ScheduleProps = {
  schedule?: MessageSimpleSchedule;
  onChange: (schedule?: MessageSimpleSchedule) => void;
};

export default function Step2Schedule({ schedule, onChange }: Step2ScheduleProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 2. 일정 (선택)</h2>
        <p>날짜/시간/장소 정보를 입력합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>날짜</span>
          <input
            type="date"
            value={schedule?.date ?? ''}
            onChange={(event) => onChange({ ...(schedule ?? {}), date: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>시간</span>
          <input
            type="time"
            value={schedule?.time ?? ''}
            onChange={(event) => onChange({ ...(schedule ?? {}), time: event.target.value })}
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>장소</span>
        <input
          type="text"
          value={schedule?.place ?? ''}
          onChange={(event) => onChange({ ...(schedule ?? {}), place: event.target.value })}
          placeholder="예: 서울 강남구 작은 모임"
        />
      </label>
    </section>
  );
}
