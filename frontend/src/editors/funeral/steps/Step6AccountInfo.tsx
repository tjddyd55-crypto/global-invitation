'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../funeralEditor.module.css';

export default function Step6AccountInfo() {
  const { t } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.accounts')}</h2>
        <p>{t('editor.funeral.accountsDesc')}</p>
      </div>
      <div className={styles.noticeBox}>
        {t('editor.funeral.accountsNotice')}
      </div>
    </section>
  );
}
