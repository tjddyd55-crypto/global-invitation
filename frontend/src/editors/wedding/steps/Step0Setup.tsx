'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorSetup } from '../state/weddingEditor.types';

type Step0SetupProps = {
  value: WeddingEditorSetup;
  onChange: (value: Partial<WeddingEditorSetup>) => void;
};

const CONCEPT_LABEL: Record<WeddingEditorSetup['conceptType'], string> = {
  WEDDING: '결혼식',
  FUNERAL: '부고장',
  GENERAL: '일반 행사',
};

export default function Step0Setup({ value, onChange }: Step0SetupProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 0. 기본 설정</h2>
        <p>템플릿 엔진은 FULL 고정이며, 컨셉과 언어를 설정합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>초대장 타입</span>
          <div className={styles.readOnlyField}>FULL (고정)</div>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>템플릿</span>
          <div className={styles.readOnlyField}>invitation_full (고정)</div>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>컨셉</span>
          <div className={styles.readOnlyField}>{CONCEPT_LABEL[value.conceptType]}</div>
        </div>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>언어 선택</span>
          <select
            value={value.language}
            onChange={(event) => onChange({ language: event.target.value as WeddingEditorSetup['language'] })}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="mn">Монгол</option>
          </select>
        </label>
      </div>
      <div className={styles.noticeBox}>
        컨셉은 초대장을 만들 때 결정되며, 편집 중에는 변경할 수 없습니다. 언어는 아래에서 변경할 수 있습니다.
      </div>
    </section>
  );
}
