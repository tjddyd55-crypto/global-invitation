'use client';

import styles from '../funeralEditor.module.css';
import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';

type Step3ScheduleProps = {
  schedule: FuneralInvitation['schedule'];
  onChange: (schedule: FuneralInvitation['schedule']) => void;
};

export default function Step3Schedule({ schedule, onChange }: Step3ScheduleProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 3. 장례 일정</h2>
        <p>빈소/발인/장지를 입력합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>빈소 시작 (선택)</span>
          <input
            type="datetime-local"
            value={schedule.wakeStart ?? ''}
            onChange={(event) => onChange({ ...schedule, wakeStart: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>발인 일시</span>
          <input
            type="datetime-local"
            value={schedule.funeralDate}
            onChange={(event) => onChange({ ...schedule, funeralDate: event.target.value })}
            required
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>장지 (선택)</span>
        <input
          type="text"
          value={schedule.burial ?? ''}
          onChange={(event) => onChange({ ...schedule, burial: event.target.value })}
          placeholder="예: 성지 공원묘원"
        />
      </label>
    </section>
  );
}
