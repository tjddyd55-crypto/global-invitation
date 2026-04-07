'use client';

import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import { cdnImageSrc } from '@/src/lib/image';
import type { WeddingEditorShare } from '../state/weddingEditor.types';

type Step9SharePreviewProps = {
  data: InvitationRuntimeData;
  share: WeddingEditorShare;
  previewShare: WeddingEditorShare;
  heroImage: string;
  showRsvp: boolean;
  showGuestbook: boolean;
  onShareChange: (value: Partial<WeddingEditorShare>) => void;
};

export default function Step9SharePreview({
  data,
  share,
  previewShare,
  heroImage,
  showRsvp,
  showGuestbook,
  onShareChange,
}: Step9SharePreviewProps) {
  const ogImage = previewShare.ogImage || heroImage;

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 9. 공유 미리보기</h2>
        <p>실제 초대장과 공유 카드(OG)를 확인합니다.</p>
      </div>
      <div className={styles.previewStack}>
        <div className={styles.previewFull}>
          <FullInvitationRenderer data={data} showRsvp={showRsvp} showGuestbook={showGuestbook} />
        </div>
        <div className={styles.ogEditor}>
          <div className={styles.subSectionTitle}>공유 카드(OG) 설정</div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>OG 제목</span>
            <input
              type="text"
              value={share.ogTitle}
              onChange={(event) => onShareChange({ ogTitle: event.target.value })}
              placeholder="예: 유동규 ♥ 이소영 결혼합니다"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>OG 설명</span>
            <textarea
              rows={3}
              value={share.ogDescription}
              onChange={(event) => onShareChange({ ogDescription: event.target.value })}
              placeholder="예: 2025.04.13 오후 5시 · 더링크호텔 서울"
            />
          </label>
          <ImageUploader
            label="OG 이미지 (선택)"
            description="미지정 시 대표 이미지가 사용됩니다."
            value={share.ogImage}
            onChange={(ogImage) => onShareChange({ ogImage })}
            onClear={() => onShareChange({ ogImage: '' })}
          />
          <div className={styles.ogPreviewCard}>
            <div className={styles.ogPreviewImage}>
              {ogImage ? <img src={cdnImageSrc(ogImage)} alt="OG preview" loading="lazy" /> : <span>이미지 없음</span>}
            </div>
            <div className={styles.ogPreviewBody}>
              <div className={styles.ogPreviewTitle}>{previewShare.ogTitle || 'OG 제목 미입력'}</div>
              <div className={styles.ogPreviewDescription}>{previewShare.ogDescription || 'OG 설명 미입력'}</div>
              {!share.ogImage && (
                <div className={styles.ogPreviewHint}>OG 이미지가 없으면 대표 이미지가 사용됩니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
