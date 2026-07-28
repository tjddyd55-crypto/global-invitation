'use client';

import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorHero } from '../state/weddingEditor.types';

type Step2HeroImageProps = {
  value: WeddingEditorHero;
  onChange: (value: Partial<WeddingEditorHero>) => void;
};

/**
 * Figma Make Hero upload step — callout + dashed upload (4:3 / 10MB).
 */
export default function Step2HeroImage({ value, onChange }: Step2HeroImageProps) {
  return (
    <section className={`${styles.stepSection} ${styles.stepSectionNoTitle}`}>
      <div className={styles.heroCallout}>
        <span className={styles.heroCalloutIcon} aria-hidden>
          🖼
        </span>
        <div>
          <p className={styles.heroCalloutTitle}>Hero 대표 이미지</p>
          <p className={styles.heroCalloutBody}>
            초대장 최상단에 크게 표시되는 첫인상 사진입니다.
            <br />
            신랑·신부 사진 및 갤러리 사진과 별도로 관리됩니다.
          </p>
        </div>
      </div>

      <ImageUploader
        label="이미지 선택"
        description="JPG, PNG, WEBP · 권장 비율 4:3 · 최대 10MB"
        value={value.heroImage}
        onChange={(heroImage) => onChange({ heroImage })}
        onClear={() => onChange({ heroImage: '' })}
        uploadAssetType="hero"
        thumbnailRole="hero"
        inputTestId="hero-upload-input"
        required
        priority
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
