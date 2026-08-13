'use client';

import MultiImageUploader from '../components/MultiImageUploader';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
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
  const { t } = useInvitationT();
  const displayMode: GalleryDisplayMode = value.displayMode === 'GRID_EXPAND' ? 'GRID_EXPAND' : 'SLIDE';

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.gallery.heading')}</h2>
        <p>{t('editor.gallery.desc')}</p>
      </div>

      <div className={styles.galleryModeBlock} data-testid="gallery-display-mode">
        <p className={styles.galleryModeLabel}>{t('editor.gallery.mode')}</p>
        <div className={styles.galleryModeCards} role="radiogroup" aria-label={t('editor.gallery.mode')}>
          <button
            type="button"
            role="radio"
            aria-checked={displayMode === 'SLIDE'}
            className={`${styles.galleryModeCard} ${displayMode === 'SLIDE' ? styles.galleryModeCardActive : ''}`.trim()}
            data-testid="gallery-mode-slide"
            onClick={() => onDisplayModeChange?.('SLIDE')}
          >
            <span className={styles.galleryModeTitle}>{t('editor.gallery.slide')}</span>
            <span className={styles.galleryModeDesc}>{t('editor.gallery.slideDesc')}</span>
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
            <span className={styles.galleryModeTitle}>{t('editor.gallery.grid')}</span>
            <span className={styles.galleryModeDesc}>{t('editor.gallery.gridDesc')}</span>
            <span className={styles.galleryModeIcon} aria-hidden>
              ▦
            </span>
          </button>
        </div>
      </div>

      <MultiImageUploader
        label={t('editor.gallery.images')}
        description={t('editor.gallery.imagesDesc')}
        images={value.images}
        onChange={onChange}
        onPersist={onPersist}
        inputTestId="gallery-upload-input"
        onUploadStateChange={onUploadStateChange}
      />
    </section>
  );
}
