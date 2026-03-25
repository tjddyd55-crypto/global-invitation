'use client';

import styles from '../funeralEditor.module.css';
import ImageUploader from '../components/ImageUploader';

type Step0BasicProps = {
  deceasedName: string;
  birthDate?: string;
  deathDate: string;
  heroImage?: string;
  onChange: (payload: {
    deceasedName?: string;
    birthDate?: string;
    deathDate?: string;
    heroImage?: string;
  }) => void;
};

export default function Step0Basic({
  deceasedName,
  birthDate,
  deathDate,
  heroImage,
  onChange,
}: Step0BasicProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 0. 기본 정보</h2>
        <p>고인명과 별세일을 입력합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>고인명</span>
          <input
            type="text"
            value={deceasedName}
            onChange={(event) => onChange({ deceasedName: event.target.value })}
            placeholder="예: 홍길동"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>별세일</span>
          <input
            type="date"
            value={deathDate}
            onChange={(event) => onChange({ deathDate: event.target.value })}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>생년월일 (선택)</span>
          <input
            type="date"
            value={birthDate ?? ''}
            onChange={(event) => onChange({ birthDate: event.target.value })}
          />
        </label>
      </div>
      <ImageUploader
        label="Hero 이미지 (선택)"
        description="사진이 없으면 단색 배경이 사용됩니다."
        value={heroImage}
        onChange={(value) => onChange({ heroImage: value })}
        onClear={() => onChange({ heroImage: '' })}
        uploadAssetType="hero"
        priority
      />
    </section>
  );
}
