'use client';

import { useId, useRef, useState } from 'react';
import AppImage from '@/src/components/media/AppImage';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import { deleteMediaFile, uploadMediaImage, type MediaUploadAssetType } from '@/src/lib/mediaApi';
import { isSharedInvitationAssetUrlOrKey } from '@/src/invitation/galleryAsset';
import { persistThenDeleteMedia } from '../lib/persistThenDeleteMedia';
import styles from '../weddingEditor.module.css';

type ImageUploaderProps = {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  /**
   * Persist invitation draft after local clear (gallery-style).
   * Remote DELETE runs only after this resolves successfully.
   */
  onPersistClear?: () => Promise<void>;
  /** When false, only draft is cleared (e.g. share HERO mode reuses hero object). */
  shouldDeleteRemote?: boolean;
  required?: boolean;
  uploadAssetType?: MediaUploadAssetType;
  inputTestId?: string;
  clearTestId?: string;
  /** LCP: 대표(히어로) 미리보기에만 사용 */
  priority?: boolean;
  /** Editor 전용 썸네일 레이아웃 — Public 비율과 분리 */
  thumbnailRole?: 'default' | 'couple' | 'hero' | 'openGraph' | 'logo';
};

function revokeIfObjectUrl(url?: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function isRemoteDeletableUrl(url: string): boolean {
  const trimmed = (url || '').trim();
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('invitation/')) {
    return false;
  }
  // Shared invitation assets must never be deleted from uploader clear/replace.
  if (isSharedInvitationAssetUrlOrKey(trimmed)) return false;
  return /^https?:\/\//i.test(trimmed);
}

export default function ImageUploader({
  label,
  description,
  value,
  onChange,
  onClear,
  onPersistClear,
  shouldDeleteRemote = true,
  required,
  uploadAssetType = 'gallery',
  inputTestId,
  clearTestId,
  priority,
  thumbnailRole = 'default',
}: ImageUploaderProps) {
  const { t } = useInvitationT();
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const clearInFlightRef = useRef(false);

  const busy = uploading || clearing;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || busy) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setCleanupWarning(null);

    try {
      if (value) {
        revokeIfObjectUrl(value);
      }

      const uploaded = await uploadMediaImage(file, {
        assetType: uploadAssetType,
        onProgress: (next) => setProgress(next),
      });
      onChange(uploaded.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t('editor.upload.failed'));
    } finally {
      setUploading(false);
      setProgress(0);
      event.target.value = '';
    }
  };

  const handleClear = async () => {
    if (!value || clearInFlightRef.current || busy) return;
    const previousUrl = value;
    clearInFlightRef.current = true;
    setClearing(true);
    setError(null);
    setCleanupWarning(null);

    const status = await persistThenDeleteMedia({
      applyDraftRemoval: () => {
        revokeIfObjectUrl(previousUrl);
        onClear?.();
        if (!onClear) {
          onChange('');
        }
      },
      rollbackDraft: () => {
        onChange(previousUrl);
      },
      persistDraft: async () => {
        if (onPersistClear) {
          await onPersistClear();
        }
      },
      deleteRemote:
        shouldDeleteRemote && isRemoteDeletableUrl(previousUrl)
          ? async () => {
              await deleteMediaFile(previousUrl);
            }
          : null,
    });

    if (status === 'persist_failed') {
      setError(t('editor.upload.saveFailed'));
    } else if (status === 'delete_failed') {
      setCleanupWarning(t('editor.upload.cleanupLater'));
    }

    setClearing(false);
    clearInFlightRef.current = false;
  };

  const previewClass =
    thumbnailRole === 'couple'
      ? `${styles.uploaderPreview} ${styles.editorCoupleThumbnail}`
      : thumbnailRole === 'hero'
        ? `${styles.uploaderPreview} ${styles.editorHeroThumbnail}`
        : thumbnailRole === 'openGraph'
          ? `${styles.uploaderPreview} ${styles.editorOgThumbnail}`
          : thumbnailRole === 'logo'
            ? `${styles.uploaderPreview} ${styles.editorLogoThumbnail}`
            : styles.uploaderPreview;

  const uploaderClass =
    thumbnailRole === 'couple'
      ? `${styles.uploader} ${styles.editorCoupleImageCard}`
      : thumbnailRole === 'logo'
        ? `${styles.uploader} ${styles.editorLogoImageCard}`
        : styles.uploader;

  return (
    <div className={uploaderClass}>
      <div className={styles.fieldHeader}>
        <label className={styles.fieldLabel} htmlFor={inputId}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        {description && <p className={styles.fieldDescription}>{description}</p>}
      </div>
      <div className={styles.uploaderBody}>
        {value ? (
          <button
            type="button"
            className={previewClass}
            data-testid={
              thumbnailRole === 'couple'
                ? 'editor-couple-thumbnail'
                : thumbnailRole === 'logo'
                  ? 'editor-logo-thumbnail'
                  : undefined
            }
            onClick={() => setLightboxOpen(true)}
            aria-label={t('editor.upload.viewOriginal', { label })}
            disabled={busy}
          >
            <AppImage src={value} alt={t('editor.upload.originalAria', { label })} priority={priority} />
          </button>
        ) : (
          <div className={styles.uploaderPlaceholder}>{t('editor.upload.choosePlaceholder')}</div>
        )}
        <div
          className={
            thumbnailRole === 'couple'
              ? `${styles.uploaderActions} ${styles.editorCoupleImageActions}`
              : styles.uploaderActions
          }
        >
          <label className={styles.buttonGhost} htmlFor={inputId} aria-disabled={busy}>
            {uploading
              ? t('editor.upload.uploading')
              : clearing
                ? t('editor.upload.removing')
                : t('editor.upload.select')}
          </label>
          {value && (
            <button
              type="button"
              className={styles.buttonSubtle}
              onClick={() => void handleClear()}
              disabled={busy}
              data-testid={clearTestId || 'image-uploader-clear'}
            >
              {clearing ? t('editor.upload.removing') : t('editor.upload.remove')}
            </button>
          )}
        </div>
        {uploading && (
          <div className={styles.uploadProgressTrack}>
            <div className={styles.uploadProgressBar} style={{ width: `${progress}%` }} />
          </div>
        )}
        {clearing ? (
          <p className={styles.fieldDescription} data-testid="image-uploader-persist-status">
            {t('editor.upload.persistClearing')}
          </p>
        ) : null}
        {error && (
          <p className={styles.fieldDescription} data-testid="image-uploader-error">
            {error}
          </p>
        )}
        {cleanupWarning && (
          <p className={styles.fieldDescription} data-testid="image-uploader-cleanup-warning">
            {cleanupWarning}
          </p>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.hiddenInput}
          data-testid={inputTestId}
          onChange={(event) => void handleFileChange(event)}
          disabled={busy}
        />
      </div>
      {lightboxOpen && value ? (
        <div
          className={styles.editorImageLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={t('editor.upload.originalAria', { label })}
          onClick={() => setLightboxOpen(false)}
        >
          <AppImage src={value} alt="" />
        </div>
      ) : null}
    </div>
  );
}
