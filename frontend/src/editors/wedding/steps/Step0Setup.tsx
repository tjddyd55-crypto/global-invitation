'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorSetup } from '../state/weddingEditor.types';

type Step0SetupProps = {
  value: WeddingEditorSetup;
  onChange: (value: Partial<WeddingEditorSetup>) => void;
};

export default function Step0Setup({ value, onChange }: Step0SetupProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 0. 기본 설정</h2>
        <p>초대장 타입과 템플릿은 고정입니다. 언어만 최초 1회 선택합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>초대장 타입</span>
          <div className={styles.readOnlyField}>결혼식 (고정)</div>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>템플릿</span>
          <div className={styles.readOnlyField}>wedding_classic (고정)</div>
        </div>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>언어 선택</span>
          <select value={value.language} onChange={(event) => onChange({ language: event.target.value as WeddingEditorSetup['language'] })}>
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="mn">Монгол</option>
          </select>
        </label>
      </div>
      <div className={styles.noticeBox}>
        최초 1회만 입력하며, 이후 단계에서는 변경할 수 없습니다.
      </div>
    </section>
  );
}
