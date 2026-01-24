'use client';

import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorHero } from '../state/weddingEditor.types';

type Step2HeroImageProps = {
  value: WeddingEditorHero;
  onChange: (value: Partial<WeddingEditorHero>) => void;
};

export default function Step2HeroImage({ value, onChange }: Step2HeroImageProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 2. 대표 이미지</h2>
        <p>공유 썸네일로 사용되는 대표 이미지를 업로드합니다.</p>
      </div>
      <ImageUploader
        label="대표 이미지"
        description="공유 시 이 이미지가 사용됩니다."
        value={value.heroImage}
        onChange={(heroImage) => onChange({ heroImage })}
        onClear={() => onChange({ heroImage: '' })}
        required
      />
      <label className={styles.field}>
        <span className={styles.fieldLabel}>오버레이 문구 (선택)</span>
        <input
          type="text"
          value={value.overlayText ?? ''}
          onChange={(event) => onChange({ overlayText: event.target.value })}
          placeholder="예: Welcome to our wedding"
        />
      </label>
    </section>
  );
}
