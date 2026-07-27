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
        <h2>참석 여부 · 메시지</h2>
        <p>참석 여부와 공개 댓글(축하/추모 메시지) 노출을 설정합니다.</p>
      </div>
      <div className={styles.toggleGroup}>
        <ToggleRow
          label="참석 여부"
          description="OFF 시 참석 여부 섹션을 숨깁니다."
          checked={value.rsvpEnabled}
          onChange={(checked) => onChange({ rsvpEnabled: checked })}
        />
        <ToggleRow
          label="댓글·메시지 받기"
          description="OFF 시 공개 초대장의 댓글 섹션을 숨깁니다. (RSVP 메시지와 별개)"
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
