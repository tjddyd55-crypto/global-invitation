'use client';

import ImageUploader from '../components/ImageUploader';
import ToggleRow from '../components/ToggleRow';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorExtras, WeddingEditorShare } from '../state/weddingEditor.types';
import { cdnImageSrc } from '@/src/lib/image';

type Step8ExtrasProps = {
  value: WeddingEditorExtras;
  onChange: (value: Partial<WeddingEditorExtras>) => void;
  share: WeddingEditorShare;
  onShareChange: (value: Partial<WeddingEditorShare>) => void;
  heroImage: string;
};

export default function Step8Extras({
  value,
  onChange,
  share,
  onShareChange,
  heroImage,
}: Step8ExtrasProps) {
  const ogImage = (share.ogImage ?? '').trim() || (heroImage ?? '').trim();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 8. 부가 기능 · 공유 카드</h2>
        <p>RSVP·방명록·공개 시 사용할 공유 카드(OG) 필드를 설정합니다. 미리보기는 우측 라이브 패널만 사용합니다.</p>
      </div>
      <div className={styles.toggleGroup}>
        <ToggleRow
          label="참석 여부"
          description="OFF 시 참석 여부 섹션을 숨깁니다."
          checked={value.rsvpEnabled}
          onChange={(checked) => onChange({ rsvpEnabled: checked })}
        />
        <ToggleRow
          label="방명록"
          description="OFF 시 방명록(메시지) 섹션을 숨깁니다."
          checked={value.guestbookEnabled}
          onChange={(checked) => onChange({ guestbookEnabled: checked })}
        />
      </div>
      {value.rsvpEnabled && (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>참석 여부 버튼 문구</span>
          <input
            type="text"
            value={value.rsvpButtonText ?? ''}
            onChange={(event) => onChange({ rsvpButtonText: event.target.value })}
            placeholder="예: 참석 여부 전달"
          />
        </label>
      )}

      <div className={styles.ogEditor}>
        <div className={styles.subSectionTitle}>공유 카드(OG)</div>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>OG 제목</span>
          <input
            type="text"
            value={share.ogTitle}
            onChange={(event) => onShareChange({ ogTitle: event.target.value })}
            placeholder="공유 시 제목"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>OG 설명</span>
          <textarea
            rows={3}
            value={share.ogDescription}
            onChange={(event) => onShareChange({ ogDescription: event.target.value })}
            placeholder="공유 시 설명"
          />
        </label>
        <ImageUploader
          label="OG 이미지 (선택)"
          description="비우면 대표 이미지가 사용됩니다."
          value={share.ogImage}
          onChange={(next) => onShareChange({ ogImage: next })}
          onClear={() => onShareChange({ ogImage: '' })}
        />
        <div className={styles.ogPreviewCard}>
          <div className={styles.ogPreviewImage}>
            {ogImage ? <img src={cdnImageSrc(ogImage)} alt="" loading="lazy" /> : <span>이미지 없음</span>}
          </div>
          <div className={styles.ogPreviewBody}>
            <div className={styles.ogPreviewTitle}>{share.ogTitle.trim() || 'OG 제목'}</div>
            <div className={styles.ogPreviewDescription}>{share.ogDescription.trim() || 'OG 설명'}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
