'use client';

import styles from '../funeralEditor.module.css';

type Step2FamilyProps = {
  chiefMourner: string;
  familyMembers?: string[];
  onChange: (payload: { chiefMourner?: string; familyMembers?: string[] }) => void;
};

function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function Step2Family({ chiefMourner, familyMembers, onChange }: Step2FamilyProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>고인 정보</h2>
        <p>고인/유가족 관련 정보를 입력합니다.</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>고인 대표자</span>
        <input
          type="text"
          value={chiefMourner}
          onChange={(event) => onChange({ chiefMourner: event.target.value })}
          placeholder="예: 김순덕"
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>유가족 관계 (선택)</span>
        <textarea
          rows={4}
          value={(familyMembers ?? []).join('\n')}
          onChange={(event) => onChange({ familyMembers: toLines(event.target.value) })}
          placeholder="예: 아들 홍석주 · 홍석민"
        />
      </label>
    </section>
  );
}
