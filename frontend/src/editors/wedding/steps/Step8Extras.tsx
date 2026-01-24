'use client';

import ToggleRow from '../components/ToggleRow';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorExtras } from '../state/weddingEditor.types';

type Step8ExtrasProps = {
  value: WeddingEditorExtras;
  onChange: (value: Partial<WeddingEditorExtras>) => void;
};

export default function Step8Extras({ value, onChange }: Step8ExtrasProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 8. 부가 기능</h2>
        <p>ON/OFF 상태에 따라 관련 UI와 데이터가 노출됩니다.</p>
      </div>
      <div className={styles.toggleGroup}>
        <ToggleRow
          label="참석 여부"
          description="OFF 시 참석 여부 섹션을 숨깁니다."
          checked={value.rsvpEnabled}
          onChange={(checked) => onChange({ rsvpEnabled: checked })}
        />
        <ToggleRow
          label="방명록"
          description="OFF 시 방명록(메시지) 섹션을 숨깁니다."
          checked={value.guestbookEnabled}
          onChange={(checked) => onChange({ guestbookEnabled: checked })}
        />
      </div>
      {value.rsvpEnabled && (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>참석 여부 버튼 문구</span>
          <input
            type="text"
            value={value.rsvpButtonText ?? ''}
            onChange={(event) => onChange({ rsvpButtonText: event.target.value })}
            placeholder="예: 참석 여부 전달"
          />
        </label>
      )}
    </section>
  );
}
