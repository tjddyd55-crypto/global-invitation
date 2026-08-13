'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../funeralEditor.module.css';

type Step1MessageProps = {
  message: string;
  onChange: (message: string) => void;
};

export default function Step1Message({ message, onChange }: Step1MessageProps) {
  const { t } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.memorialMessage')}</h2>
        <p>부고문을 입력합니다. 줄바꿈을 지원합니다.</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('editor.section.memorialMessage')}</span>
        <textarea
          rows={6}
          value={message}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('editor.default.funeralMessage')}
          required
        />
      </label>
    </section>
  );
}
