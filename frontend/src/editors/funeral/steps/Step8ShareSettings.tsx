'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../funeralEditor.module.css';

export default function Step8ShareSettings() {
  const { t } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.sharing')}</h2>
        <p>{t('editor.funeral.shareDesc')}</p>
      </div>
      <div className={styles.noticeBox}>
        {t('editor.funeral.shareNotice')}
      </div>
    </section>
  );
}
