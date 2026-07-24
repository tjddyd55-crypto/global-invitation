'use client';

import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorShare } from '../state/weddingEditor.types';
import { cdnImageSrc } from '@/src/lib/image';

type Step9ShareSettingsProps = {
  value: WeddingEditorShare;
  onChange: (value: Partial<WeddingEditorShare>) => void;
  heroImage: string;
};

export default function Step9ShareSettings({ value, onChange, heroImage }: Step9ShareSettingsProps) {
  const ogImage = (value.ogImage ?? '').trim() || (heroImage ?? '').trim();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>공유 설정</h2>
        <p>공개 시 사용하는 공유 카드(OG) 정보를 설정합니다.</p>
      </div>
      <div className={styles.ogEditor}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>OG 제목</span>
          <input
            type="text"
            value={value.ogTitle}
            onChange={(event) => onChange({ ogTitle: event.target.value })}
            placeholder="공유 시 제목"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>OG 설명</span>
          <textarea
            rows={3}
            value={value.ogDescription}
            onChange={(event) => onChange({ ogDescription: event.target.value })}
            placeholder="공유 시 설명"
          />
        </label>
        <ImageUploader
          label="OG 이미지 (선택)"
          description="비우면 대표 이미지가 사용됩니다."
          value={value.ogImage}
          onChange={(next) => onChange({ ogImage: next })}
          onClear={() => onChange({ ogImage: '' })}
        />
        <div className={styles.ogPreviewCard}>
          <div className={styles.ogPreviewImage}>
            {ogImage ? <img src={cdnImageSrc(ogImage)} alt="" loading="lazy" /> : <span>이미지 없음</span>}
          </div>
          <div className={styles.ogPreviewBody}>
            <div className={styles.ogPreviewTitle}>{value.ogTitle.trim() || 'OG 제목'}</div>
            <div className={styles.ogPreviewDescription}>{value.ogDescription.trim() || 'OG 설명'}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
