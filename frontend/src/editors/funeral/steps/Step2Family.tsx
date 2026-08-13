'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
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
  const { t } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.deceased')}</h2>
        <p>고인/유가족 관련 정보를 입력합니다.</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('editor.field.chiefContact')}</span>
        <input
          type="text"
          value={chiefMourner}
          onChange={(event) => onChange({ chiefMourner: event.target.value })}
          placeholder={t('editor.placeholder.funeralContact')}
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
