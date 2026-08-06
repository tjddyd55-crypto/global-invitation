'use client';

import MultiImageUploader from '../components/MultiImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorGallery, WeddingEditorImage } from '../state/weddingEditor.types';
import type { GalleryDisplayMode } from '@/src/invitation/galleryDisplay';

type Step5GalleryProps = {
  value: WeddingEditorGallery;
  onChange: (images: WeddingEditorImage[]) => void;
  onDisplayModeChange?: (mode: GalleryDisplayMode) => void;
  onPersist?: (images: WeddingEditorImage[]) => Promise<void>;
  onUploadStateChange?: (state: { isUploading: boolean; hasError: boolean }) => void;
};

export default function Step5Gallery({
  value,
  onChange,
  onDisplayModeChange,
  onPersist,
  onUploadStateChange,
}: Step5GalleryProps) {
  const displayMode: GalleryDisplayMode = value.displayMode === 'GRID_EXPAND' ? 'GRID_EXPAND' : 'SLIDE';

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>갤러리</h2>
        <p>다중 이미지 업로드, 순서 변경, 삭제가 가능합니다. 삭제는 즉시 저장됩니다.</p>
      </div>

      <div className={styles.galleryModeBlock} data-testid="gallery-display-mode">
        <p className={styles.galleryModeLabel}>갤러리 표시 방식</p>
        <div className={styles.galleryModeCards} role="radiogroup" aria-label="갤러리 표시 방식">
          <button
            type="button"
            role="radio"
            aria-checked={displayMode === 'SLIDE'}
            className={`${styles.galleryModeCard} ${displayMode === 'SLIDE' ? styles.galleryModeCardActive : ''}`.trim()}
            data-testid="gallery-mode-slide"
            onClick={() => onDisplayModeChange?.('SLIDE')}
          >
            <span className={styles.galleryModeTitle}>슬라이드형</span>
            <span className={styles.galleryModeDesc}>
              사진을 좌우로 넘겨서 한 장씩 볼 수 있습니다. 선택한 템플릿 디자인에 맞는 슬라이드로
              표시됩니다.
            </span>
            <span className={styles.galleryModeIcon} aria-hidden>
              ▭▭
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={displayMode === 'GRID_EXPAND'}
            className={`${styles.galleryModeCard} ${displayMode === 'GRID_EXPAND' ? styles.galleryModeCardActive : ''}`.trim()}
            data-testid="gallery-mode-grid"
            onClick={() => onDisplayModeChange?.('GRID_EXPAND')}
          >
            <span className={styles.galleryModeTitle}>나열형</span>
            <span className={styles.galleryModeDesc}>
              여러 사진을 선택한 템플릿의 고유한 배열로 보여줍니다. 사진 비율에 따라 일부는 잘려
              보일 수 있으며, 사진을 누르면 원본 전체를 확인할 수 있습니다.
            </span>
            <span className={styles.galleryModeIcon} aria-hidden>
              ▦
            </span>
          </button>
        </div>
      </div>

      <MultiImageUploader
        label="갤러리 이미지"
        description="초대장 표시 순서가 입력 순서를 그대로 따릅니다. 삭제·순서 변경은 자동 저장됩니다."
        images={value.images}
        onChange={onChange}
        onPersist={onPersist}
        inputTestId="gallery-upload-input"
        onUploadStateChange={onUploadStateChange}
      />
    </section>
  );
}
