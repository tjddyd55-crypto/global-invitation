'use client';

import styles from '../funeralEditor.module.css';

export default function Step7Attendance() {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>참석 여부</h2>
        <p>현재 부고장 에디터는 RSVP 데이터를 저장하지 않습니다.</p>
      </div>
      <div className={styles.noticeBox}>
        기능/데이터 구조 변경 없이 UI를 통일하는 범위로, 참석 여부 설정은 안내 카드로 제공됩니다.
      </div>
    </section>
  );
}
