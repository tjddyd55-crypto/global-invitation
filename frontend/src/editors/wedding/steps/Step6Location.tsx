'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorLocation } from '../state/weddingEditor.types';

type Step6LocationProps = {
  value: WeddingEditorLocation;
  onChange: (value: Partial<WeddingEditorLocation>) => void;
};

function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function Step6Location({ value, onChange }: Step6LocationProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 6. 위치 안내</h2>
        <p>주소, 지도 미리보기, 교통/주차 안내를 입력합니다.</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>주소</span>
        <input
          type="text"
          value={value.address}
          onChange={(event) => onChange({ address: event.target.value })}
          placeholder="예: 서울 구로구 경인로 610"
          required
        />
      </label>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>지도 위도 (선택)</span>
          <input
            type="number"
            value={value.mapLat ?? ''}
            onChange={(event) => onChange({ mapLat: event.target.value ? Number(event.target.value) : undefined })}
            placeholder="예: 37.507"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>지도 경도 (선택)</span>
          <input
            type="number"
            value={value.mapLng ?? ''}
            onChange={(event) => onChange({ mapLng: event.target.value ? Number(event.target.value) : undefined })}
            placeholder="예: 126.889"
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>교통 안내 (선택)</span>
        <textarea
          rows={3}
          value={(value.transportInfo ?? []).join('\n')}
          onChange={(event) => onChange({ transportInfo: toLines(event.target.value) })}
          placeholder="한 줄에 하나씩 입력"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>주차 안내 (선택)</span>
        <textarea
          rows={3}
          value={(value.parkingInfo ?? []).join('\n')}
          onChange={(event) => onChange({ parkingInfo: toLines(event.target.value) })}
          placeholder="한 줄에 하나씩 입력"
        />
      </label>
    </section>
  );
}
