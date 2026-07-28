'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import AppImage from '@/src/components/media/AppImage';
import {
  sanitizeGalleryItems,
  shouldDeleteRemoteGalleryAsset,
} from '@/src/invitation/galleryAsset';
import { deleteMediaFile, uploadMediaImage } from '@/src/lib/mediaApi';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorImage } from '../state/weddingEditor.types';

type MultiImageUploaderProps = {
  label: string;
  description?: string;
  images: WeddingEditorImage[];
  onChange: (images: WeddingEditorImage[]) => void;
  inputTestId?: string;
  onUploadStateChange?: (state: { isUploading: boolean; hasError: boolean }) => void;
};

function buildId() {
  return `image-${Math.random().toString(36).slice(2, 9)}`;
}

function toEditorImages(
  items: ReturnType<typeof sanitizeGalleryItems>
): WeddingEditorImage[] {
  return items.map((item) => ({
    id: item.id || buildId(),
    url: item.url,
    name: item.name,
    mediaId: item.mediaId || item.objectKey,
    objectKey: item.objectKey,
  }));
}

type UploadQueueItem = {
  id: string;
  fileName: string;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
};

export default function MultiImageUploader({
  label,
  description,
  images,
  onChange,
  inputTestId,
  onUploadStateChange,
}: MultiImageUploaderProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  const visibleImages = useMemo(
    () =>
      toEditorImages(
        sanitizeGalleryItems(
          images.map((image) => ({
            id: image.id,
            url: image.url,
            objectKey: image.objectKey,
            mediaId: image.mediaId,
            name: image.name,
          }))
        )
      ),
    [images]
  );

  useEffect(() => {
    onUploadStateChange?.({
      isUploading: uploading,
      hasError: Boolean(error),
    });
  }, [error, onUploadStateChange, uploading]);

  const updateQueueItem = (itemId: string, next: Partial<UploadQueueItem>) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...next } : item))
    );
  };

  const enqueueAndUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setCleanupWarning(null);

    const queuedItems: UploadQueueItem[] = files.map((file) => ({
      id: buildId(),
      fileName: file.name,
      progress: 0,
      status: 'queued',
    }));
    setUploadQueue((prev) => [...prev, ...queuedItems].slice(-30));

    // Drop demo/placeholder leftovers; keep confirmed user (and explicit shared) assets only.
    const nextImages = toEditorImages(
      sanitizeGalleryItems(
        images.map((image) => ({
          id: image.id,
          url: image.url,
          objectKey: image.objectKey,
          mediaId: image.mediaId,
          name: image.name,
        }))
      )
    );
    let firstError: string | null = null;
    let uploadedCount = 0;

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const queueItem = queuedItems[index];
      if (!queueItem) continue;

      updateQueueItem(queueItem.id, { status: 'uploading', progress: 0 });

      try {
        const uploaded = await uploadMediaImage(file, {
          assetType: 'gallery',
          onProgress: (value) => {
            updateQueueItem(queueItem.id, { progress: value });
          },
        });

        nextImages.push({
          id: buildId(),
          url: uploaded.url,
          name: file.name,
          mediaId: uploaded.fileKey,
          objectKey: uploaded.objectKey,
        });
        uploadedCount += 1;
        updateQueueItem(queueItem.id, { status: 'done', progress: 100 });
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.';
        if (!firstError) firstError = message;
        updateQueueItem(queueItem.id, {
          status: 'error',
          progress: 0,
          error: message,
        });
      }
    }

    if (uploadedCount > 0 || nextImages.length !== images.length) {
      onChange(nextImages);
    }
    setError(firstError);
    setUploading(false);
  };

  const handleAddFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    await enqueueAndUpload(files);
    event.target.value = '';
  };

  const handleRemove = async (index: number) => {
    const target = visibleImages[index];
    if (!target) return;

    const nextImages = visibleImages.filter((_, idx) => idx !== index);
    onChange(nextImages);
    setCleanupWarning(null);

    if (
      !shouldDeleteRemoteGalleryAsset({
        url: target.url,
        objectKey: target.objectKey,
        mediaId: target.mediaId,
      })
    ) {
      return;
    }

    const objectKey = (target.objectKey || target.mediaId || '').trim();
    const url = (target.url || '').trim();
    if (!objectKey && !url) return;

    try {
      await deleteMediaFile(url, objectKey || undefined);
    } catch {
      setCleanupWarning('목록에서는 제거했습니다. 원격 파일 정리에 실패했을 수 있습니다.');
    }
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= visibleImages.length) return;
    const nextImages = [...visibleImages];
    const [moved] = nextImages.splice(from, 1);
    nextImages.splice(to, 0, moved);
    onChange(nextImages);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files || []);
    void enqueueAndUpload(files);
  };

  return (
    <div className={styles.uploader}>
      <div className={styles.fieldHeader}>
        <label className={styles.fieldLabel} htmlFor={inputId}>
          {label}
        </label>
        {description && <p className={styles.fieldDescription}>{description}</p>}
      </div>
      <div
        className={`${styles.uploaderBody} ${isDragOver ? styles.uploaderDropActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="gallery-dropzone"
      >
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
            data-testid={inputTestId}
            onChange={(event) => void handleAddFiles(event)}
            disabled={uploading}
          />
        </div>
        <div className={styles.uploadDropHint}>파일을 이 영역에 드래그해 여러 장을 한 번에 업로드할 수 있습니다.</div>
        {error && <p className={styles.fieldDescription}>{error}</p>}
        {cleanupWarning && <p className={styles.fieldDescription}>{cleanupWarning}</p>}
        {uploadQueue.length > 0 && (
          <div className={styles.uploadQueue}>
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className={styles.uploadQueueItem}
                data-testid="upload-queue-item"
                data-upload-status={item.status}
              >
                <div className={styles.uploadQueueMeta}>
                  <span>{item.fileName}</span>
                  <span>
                    {item.status === 'error'
                      ? '실패'
                      : item.status === 'done'
                        ? '완료'
                        : `${item.progress}%`}
                  </span>
                </div>
                <div className={styles.uploadProgressTrack}>
                  <div
                    className={styles.uploadProgressBar}
                    style={{ width: `${item.progress}%` }}
                    data-testid="upload-progress-bar"
                  />
                </div>
                {item.error && <p className={styles.fieldDescription}>{item.error}</p>}
              </div>
            ))}
          </div>
        )}
        {visibleImages.length === 0 ? (
          <div className={styles.uploaderPlaceholder} data-testid="gallery-editor-empty">
            아직 등록된 이미지가 없습니다.
          </div>
        ) : (
          <ul
            className={styles.galleryList}
            data-testid="gallery-editor-list"
            data-gallery-count={visibleImages.length}
          >
            {visibleImages.map((image, index) => (
              <li key={image.id} className={styles.galleryItem} data-testid="gallery-editor-item">
                <AppImage src={image.url} alt={image.name || `gallery-${index + 1}`} />
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
                    disabled={index === visibleImages.length - 1}
                  >
                    아래로
                  </button>
                  <button
                    type="button"
                    className={styles.buttonDanger}
                    onClick={() => void handleRemove(index)}
                    disabled={uploading}
                    data-testid="gallery-editor-delete"
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
