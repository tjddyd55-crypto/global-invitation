'use client';

import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorShare } from '../state/weddingEditor.types';
import InvitationShareCardPreview from '@/src/components/share/InvitationShareCardPreview';
import type { InvitationSharePreviewModel } from '@/src/invitation/sharePreviewModel';

type Step9ShareSettingsProps = {
  value: WeddingEditorShare;
  onChange: (value: Partial<WeddingEditorShare>) => void;
  /** 이미지 모드 변경 후 즉시 PATCH */
  onPersistShareChange?: (next: Partial<WeddingEditorShare>) => Promise<void>;
  heroImage: string;
  /** Mobile: 폼 아래 카드. Desktop: 우측 컬럼에서 표시하므로 false */
  showInlineShareCardPreview?: boolean;
  sharePreviewModel?: InvitationSharePreviewModel | null;
  persistingShareImage?: boolean;
};

export default function Step9ShareSettings({
  value,
  onChange,
  onPersistShareChange,
  heroImage,
  showInlineShareCardPreview = false,
  sharePreviewModel,
  persistingShareImage,
}: Step9ShareSettingsProps) {
  const hero = (heroImage || '').trim();
  const hasHero = Boolean(hero);

  const applySharePatch = async (patch: Partial<WeddingEditorShare>) => {
    onChange(patch);
    if (onPersistShareChange) {
      await onPersistShareChange(patch);
    }
  };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>공유 설정</h2>
        <p>카카오톡과 메신저에 초대장 링크를 공유할 때 보이는 미리보기 카드입니다.</p>
      </div>
      <div className={styles.ogEditor}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>공유 미리보기 제목</span>
          <span className={styles.fieldDescription}>
            카카오톡과 메신저에 초대장 링크를 공유할 때 표시되는 제목입니다.
          </span>
          <input
            type="text"
            value={value.ogTitle}
            onChange={(event) => onChange({ ogTitle: event.target.value })}
            placeholder="예: 유동규 ♥ 이소영 결혼합니다"
            data-testid="og-title-input"
            maxLength={80}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>공유 미리보기 설명</span>
          <span className={styles.fieldDescription}>공유 카드 제목 아래에 표시되는 설명입니다.</span>
          <textarea
            rows={3}
            value={value.ogDescription}
            onChange={(event) => onChange({ ogDescription: event.target.value })}
            placeholder="예: 소중한 날에 함께해 주세요"
            data-testid="og-description-input"
            maxLength={160}
          />
        </label>
        <ImageUploader
          label="공유 미리보기 이미지"
          description="직접 선택한 이미지가 공유 카드에 표시됩니다. 이미지를 선택하지 않으면 미리보기에는 표시되지 않으며, 실제 메신저 공유 시에는 기본 이미지가 사용될 수 있습니다."
          value={value.ogImageMode === 'NONE' ? '' : value.ogImage}
          onChange={(next) => {
            void applySharePatch({
              ogImage: next,
              ogImageMode: next.trim() ? 'CUSTOM' : 'NONE',
            });
          }}
          onClear={() => {
            void applySharePatch({ ogImage: '', ogImageMode: 'NONE' });
          }}
          uploadAssetType="asset"
          inputTestId="og-image-input"
        />
        <div className={styles.uploaderActions}>
          <button
            type="button"
            className={styles.buttonSubtle}
            onClick={() => {
              if (!hasHero) return;
              void applySharePatch({ ogImage: hero, ogImageMode: 'HERO' });
            }}
            disabled={!hasHero || persistingShareImage}
            data-testid="og-use-hero"
          >
            대표 이미지 사용
          </button>
          <button
            type="button"
            className={styles.buttonSubtle}
            onClick={() => {
              void applySharePatch({ ogImage: '', ogImageMode: 'NONE' });
            }}
            disabled={persistingShareImage}
            data-testid="og-clear-image"
          >
            이미지 제거
          </button>
        </div>
        {!hasHero ? (
          <p className={styles.fieldDescription}>대표 이미지가 없어 ‘대표 이미지 사용’을 쓸 수 없습니다.</p>
        ) : null}
        {persistingShareImage ? (
          <p className={styles.fieldDescription} data-testid="og-image-persisting">
            공유 이미지 설정을 저장하는 중…
          </p>
        ) : null}
        {showInlineShareCardPreview && sharePreviewModel ? (
          <InvitationShareCardPreview
            key={`${sharePreviewModel.imageMode}:${sharePreviewModel.imageUrl || 'none'}`}
            title={sharePreviewModel.title}
            description={sharePreviewModel.description}
            imageUrl={sharePreviewModel.imageUrl}
            canonicalUrl={sharePreviewModel.canonicalUrl}
            displayUrl={sharePreviewModel.displayUrl}
            hasPublicUrl={sharePreviewModel.hasPublicUrl}
          />
        ) : null}
      </div>
    </section>
  );
}
