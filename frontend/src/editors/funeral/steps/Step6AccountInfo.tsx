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
        <p>현재 부고장 에디터에서는 계좌 정보를 별도 저장하지 않습니다.</p>
      </div>
      <div className={styles.noticeBox}>
        데이터 구조를 변경하지 않기 위해 계좌 입력 기능은 제공하지 않습니다. 필요한 경우 본문/추가 안내 필드를 활용해 주세요.
      </div>
    </section>
  );
}
