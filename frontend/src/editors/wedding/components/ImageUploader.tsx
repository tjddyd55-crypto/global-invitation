'use client';

import { useId, useState } from 'react';
import AppImage from '@/src/components/media/AppImage';
import { deleteMediaFile, uploadMediaImage, type MediaUploadAssetType } from '@/src/lib/mediaApi';
import styles from '../weddingEditor.module.css';

type ImageUploaderProps = {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  required?: boolean;
  uploadAssetType?: MediaUploadAssetType;
  inputTestId?: string;
  /** LCP: 대표(히어로) 미리보기에만 사용 */
  priority?: boolean;
};

function revokeIfObjectUrl(url?: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export default function ImageUploader({
  label,
  description,
  value,
  onChange,
  onClear,
  required,
  uploadAssetType = 'gallery',
  inputTestId,
  priority,
}: ImageUploaderProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      if (value) {
        revokeIfObjectUrl(value);
      }

      const uploaded = await uploadMediaImage(file, {
        assetType: uploadAssetType,
        onProgress: (value) => setProgress(value),
      });
      onChange(uploaded.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setProgress(0);
      event.target.value = '';
    }
  };

  const handleClear = async () => {
    if (!value) return;

    setUploading(true);
    setError(null);

    try {
      await deleteMediaFile(value);

      onClear?.();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '이미지 삭제에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.uploader}>
      <div className={styles.fieldHeader}>
        <label className={styles.fieldLabel} htmlFor={inputId}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        {description && <p className={styles.fieldDescription}>{description}</p>}
      </div>
      <div className={styles.uploaderBody}>
        {value ? (
          <div className={styles.uploaderPreview}>
            <AppImage src={value} alt={`${label} preview`} priority={priority} />
          </div>
        ) : (
          <div className={styles.uploaderPlaceholder}>이미지를 선택하세요.</div>
        )}
        <div className={styles.uploaderActions}>
          <label className={styles.buttonGhost} htmlFor={inputId}>
            {uploading ? '업로드 중...' : '이미지 선택'}
          </label>
          {value && (
            <button type="button" className={styles.buttonSubtle} onClick={() => void handleClear()} disabled={uploading}>
              제거
            </button>
          )}
        </div>
        {uploading && (
          <div className={styles.uploadProgressTrack}>
            <div className={styles.uploadProgressBar} style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <p className={styles.fieldDescription}>{error}</p>}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.hiddenInput}
          data-testid={inputTestId}
          onChange={(event) => void handleFileChange(event)}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
