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
        <p>현재 부고장 에디터는 별도 OG 공유 설정을 저장하지 않습니다.</p>
      </div>
      <div className={styles.noticeBox}>
        공유 메타는 기본 데이터에서 자동 생성됩니다. 별도 설정 기능은 추후 정책 확정 시 추가될 수 있습니다.
      </div>
    </section>
  );
}
