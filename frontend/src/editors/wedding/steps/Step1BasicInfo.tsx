'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorBasic } from '../state/weddingEditor.types';

type Step1BasicInfoProps = {
  value: WeddingEditorBasic;
  onChange: (value: Partial<WeddingEditorBasic>) => void;
};

export default function Step1BasicInfo({ value, onChange }: Step1BasicInfoProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 1. 대표 정보</h2>
        <p>제목, 날짜/시간, 장소 정보를 입력하면 미리보기에 즉시 반영됩니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>제목</span>
          <input
            type="text"
            value={value.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="예: 유동규 ♥ 이소영"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>부제 (선택)</span>
          <input
            type="text"
            value={value.subtitle ?? ''}
            onChange={(event) => onChange({ subtitle: event.target.value })}
            placeholder="예: 사랑의 약속"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>예식 날짜/시간</span>
          <input
            type="datetime-local"
            value={value.eventDateTime}
            onChange={(event) => onChange({ eventDateTime: event.target.value })}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>장소명</span>
          <input
            type="text"
            value={value.venueName}
            onChange={(event) => onChange({ venueName: event.target.value })}
            placeholder="예: 더링크호텔 서울"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>홀 이름 (선택)</span>
          <input
            type="text"
            value={value.venueDetail ?? ''}
            onChange={(event) => onChange({ venueDetail: event.target.value })}
            placeholder="예: 3층 베일리홀"
          />
        </label>
      </div>
    </section>
  );
}
