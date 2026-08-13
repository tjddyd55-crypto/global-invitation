'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../funeralEditor.module.css';

type Step0BasicProps = {
  deceasedName: string;
  birthDate?: string;
  deathDate: string;
  onChange: (payload: {
    deceasedName?: string;
    birthDate?: string;
    deathDate?: string;
  }) => void;
};

export default function Step0Basic({
  deceasedName,
  birthDate,
  deathDate,
  onChange,
}: Step0BasicProps) {
  const { t } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.basicInfo')}</h2>
        <p>고인명과 별세일을 입력합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.field.deceasedName')}</span>
          <input
            type="text"
            value={deceasedName}
            onChange={(event) => onChange({ deceasedName: event.target.value })}
            placeholder={t('editor.accounts.holderPlaceholder')}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>별세일</span>
          <input
            type="date"
            value={deathDate}
            onChange={(event) => onChange({ deathDate: event.target.value })}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>생년월일 (선택)</span>
          <input
            type="date"
            value={birthDate ?? ''}
            onChange={(event) => onChange({ birthDate: event.target.value })}
          />
        </label>
      </div>
    </section>
  );
}
