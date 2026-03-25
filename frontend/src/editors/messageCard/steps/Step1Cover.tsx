'use client';

import ImageUploader from '../components/ImageUploader';
import styles from '../messageCardEditor.module.css';

type Step1CoverProps = {
  coverImage: string;
  onChange: (coverImage: string) => void;
};

export default function Step1Cover({ coverImage, onChange }: Step1CoverProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 1. 커버 이미지</h2>
        <p>메시지카드의 중심 이미지입니다. 1장 필수입니다.</p>
      </div>
      <ImageUploader
        label="커버 이미지"
        description="카카오/문자 미리보기에도 사용됩니다."
        value={coverImage}
        onChange={onChange}
        onClear={() => onChange('')}
        uploadAssetType="hero"
        required
        priority
      />
    </section>
  );
}
