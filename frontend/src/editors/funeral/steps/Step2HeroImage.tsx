'use client';

import styles from '../funeralEditor.module.css';
import ImageUploader from '../components/ImageUploader';

type Step2HeroImageProps = {
  heroImage?: string;
  onChange: (heroImage: string) => void;
};

export default function Step2HeroImage({ heroImage, onChange }: Step2HeroImageProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>대표 이미지</h2>
        <p>상단에 노출되는 대표 이미지를 설정합니다.</p>
      </div>
      <ImageUploader
        label="대표 이미지 (선택)"
        description="사진이 없으면 기본 배경이 사용됩니다."
        value={heroImage}
        onChange={onChange}
        onClear={() => onChange('')}
        uploadAssetType="hero"
        priority
      />
    </section>
  );
}
