'use client';

import { useId, useState } from 'react';
import { deleteMediaFile, uploadMediaImage } from '@/src/lib/mediaApi';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorImage } from '../state/weddingEditor.types';

type MultiImageUploaderProps = {
  label: string;
  description?: string;
  images: WeddingEditorImage[];
  onChange: (images: WeddingEditorImage[]) => void;
};

function revokeIfObjectUrl(url?: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function buildId() {
  return `image-${Math.random().toString(36).slice(2, 9)}`;
}

export default function MultiImageUploader({ label, description, images, onChange }: MultiImageUploaderProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedImages: WeddingEditorImage[] = [];

      for (const file of files) {
        const uploaded = await uploadMediaImage(file);
        uploadedImages.push({
          id: uploaded.id || buildId(),
          url: uploaded.url,
          name: uploaded.fileName || file.name,
          mediaId: uploaded.id,
        });
      }

      onChange([...images, ...uploadedImages]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const target = images[index];
    if (!target) return;

    setUploading(true);
    setError(null);

    try {
      if (target.mediaId) {
        await deleteMediaFile(target.mediaId);
      } else {
        revokeIfObjectUrl(target.url);
      }

      const nextImages = images.filter((_, idx) => idx !== index);
      onChange(nextImages);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '이미지 삭제에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const nextImages = [...images];
    const [moved] = nextImages.splice(from, 1);
    nextImages.splice(to, 0, moved);
    onChange(nextImages);
  };

  return (
    <div className={styles.uploader}>
      <div className={styles.fieldHeader}>
        <label className={styles.fieldLabel} htmlFor={inputId}>
          {label}
        </label>
        {description && <p className={styles.fieldDescription}>{description}</p>}
      </div>
      <div className={styles.uploaderBody}>
        <div className={styles.uploaderActions}>
          <label className={styles.buttonGhost} htmlFor={inputId}>
            {uploading ? '업로드 중...' : '이미지 추가'}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className={styles.hiddenInput}
            onChange={(event) => void handleAddFiles(event)}
            disabled={uploading}
          />
        </div>
        {error && <p className={styles.fieldDescription}>{error}</p>}
        {images.length === 0 ? (
          <div className={styles.uploaderPlaceholder}>아직 등록된 이미지가 없습니다.</div>
        ) : (
          <ul className={styles.galleryList}>
            {images.map((image, index) => (
              <li key={image.id} className={styles.galleryItem}>
                <img src={image.url} alt={image.name || `gallery-${index + 1}`} />
                <div className={styles.galleryControls}>
                  <button
                    type="button"
                    className={styles.buttonSubtle}
                    onClick={() => handleMove(index, index - 1)}
                    disabled={index === 0}
                  >
                    위로
                  </button>
                  <button
                    type="button"
                    className={styles.buttonSubtle}
                    onClick={() => handleMove(index, index + 1)}
                    disabled={index === images.length - 1}
                  >
                    아래로
                  </button>
                  <button
                    type="button"
                    className={styles.buttonDanger}
                    onClick={() => void handleRemove(index)}
                    disabled={uploading}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
