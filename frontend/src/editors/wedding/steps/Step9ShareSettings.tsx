'use client';

import { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorShare } from '../state/weddingEditor.types';
import { cdnImageSrc } from '@/src/lib/image';
import { KAKAO_SHARE_FALLBACK_NOTICE, type KakaoShareMode } from '@/src/lib/shareKakaoTalk';

type Step9ShareSettingsProps = {
  value: WeddingEditorShare;
  onChange: (value: Partial<WeddingEditorShare>) => void;
  heroImage: string;
  /** save → shareSlug → Kakao.Share.sendDefault (Editor draft만으로 SDK 호출 금지) */
  onShareKakaoTalk?: () => Promise<KakaoShareMode | null>;
  sharingKakao?: boolean;
};

export default function Step9ShareSettings({
  value,
  onChange,
  heroImage,
  onShareKakaoTalk,
  sharingKakao,
}: Step9ShareSettingsProps) {
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const previewImage = (value.ogImage ?? '').trim() || (heroImage ?? '').trim();
  const siteHint =
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'frontend-development-1b8a.up.railway.app';

  const handleShareKakao = async () => {
    if (!onShareKakaoTalk) return;
    setShareNotice(null);
    try {
      const mode = await onShareKakaoTalk();
      if (mode === null) {
        setShareNotice('공개 링크가 없습니다. 먼저 초대장을 공개한 뒤 공유해 주세요.');
        return;
      }
      if (mode === 'kakao-sdk') {
        setShareNotice('카카오톡 공유 창을 열었습니다.');
        return;
      }
      setShareNotice(KAKAO_SHARE_FALLBACK_NOTICE);
    } catch {
      setShareNotice('저장 또는 카카오톡 공유에 실패했습니다. 다시 시도해 주세요.');
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
          description="카카오톡과 메신저 링크 카드에 표시되는 이미지입니다. 권장 크기 1200×630px. 비우면 대표 이미지가 사용됩니다."
          value={value.ogImage}
          onChange={(next) => onChange({ ogImage: next })}
          onClear={() => onChange({ ogImage: '' })}
          uploadAssetType="asset"
          inputTestId="og-image-input"
        />
        <div className={styles.uploaderActions}>
          <button
            type="button"
            className={styles.buttonSubtle}
            onClick={() => onChange({ ogImage: (heroImage || '').trim() })}
            data-testid="og-use-hero"
          >
            대표 이미지 사용
          </button>
          <button
            type="button"
            className={styles.buttonSubtle}
            onClick={() => onChange({ ogImage: '' })}
            data-testid="og-clear-image"
          >
            이미지 제거
          </button>
        </div>
        <div className={styles.ogPreviewCard} data-testid="og-preview-card">
          <div className={styles.ogPreviewImage}>
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cdnImageSrc(previewImage)} alt="" loading="lazy" />
            ) : (
              <span>이미지 없음</span>
            )}
          </div>
          <div className={styles.ogPreviewBody}>
            <div className={styles.ogPreviewTitle}>{value.ogTitle.trim() || '공유 미리보기 제목'}</div>
            <div className={styles.ogPreviewDescription}>
              {value.ogDescription.trim() || '공유 미리보기 설명'}
            </div>
            <div className={styles.fieldDescription}>{siteHint}</div>
          </div>
        </div>
        {onShareKakaoTalk ? (
          <div className={styles.uploaderActions}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={() => void handleShareKakao()}
              disabled={sharingKakao}
              data-testid="og-share-kakao-talk"
            >
              {sharingKakao ? '저장 후 공유 중…' : '저장 후 카카오톡 공유'}
            </button>
          </div>
        ) : null}
        {shareNotice ? <p className={styles.fieldDescription}>{shareNotice}</p> : null}
      </div>
    </section>
  );
}
