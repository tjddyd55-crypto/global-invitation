'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import AppImage from '@/src/components/media/AppImage';
import {
  sanitizeGalleryItems,
  shouldDeleteRemoteGalleryAsset,
} from '@/src/invitation/galleryAsset';
import { deleteMediaFile, MediaApiError, uploadMediaImage } from '@/src/lib/mediaApi';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorImage } from '../state/weddingEditor.types';

type MultiImageUploaderProps = {
  label: string;
  description?: string;
  images: WeddingEditorImage[];
  onChange: (images: WeddingEditorImage[]) => void;
  /** Invitation draft PATCH — gallery persistence SSOT (required for durable deletes). */
  onPersist?: (images: WeddingEditorImage[]) => Promise<void>;
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

type PreviewTarget = {
  url: string;
  name: string;
};

export default function MultiImageUploader({
  label,
  description,
  images,
  onChange,
  onPersist,
  inputTestId,
  onUploadStateChange,
}: MultiImageUploaderProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const [persistStatus, setPersistStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);

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

  const activeQueue = useMemo(
    () => uploadQueue.filter((item) => item.status !== 'done'),
    [uploadQueue]
  );

  useEffect(() => {
    onUploadStateChange?.({
      isUploading: uploading,
      hasError: Boolean(error),
    });
  }, [error, onUploadStateChange, uploading]);

  useEffect(() => {
    if (!previewTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewTarget(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewTarget]);

  const updateQueueItem = (itemId: string, next: Partial<UploadQueueItem>) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...next } : item))
    );
  };

  const commitImages = async (
    nextImages: WeddingEditorImage[],
    previousImages: WeddingEditorImage[]
  ): Promise<boolean> => {
    onChange(nextImages);
    if (!onPersist) {
      return true;
    }
    setPersistStatus('saving');
    setError(null);
    try {
      await onPersist(nextImages);
      setPersistStatus('saved');
      return true;
    } catch (persistError) {
      onChange(previousImages);
      setPersistStatus('error');
      if (persistError instanceof MediaApiError && persistError.errorCode === 'AUTH_REQUIRED') {
        setError(persistError.message);
      } else {
        setError('변경사항을 저장하지 못했습니다. 다시 시도해 주세요.');
      }
      return false;
    }
  };

  const cleanupRemoteAsset = (item: WeddingEditorImage) => {
    if (
      !shouldDeleteRemoteGalleryAsset({
        url: item.url,
        objectKey: item.objectKey,
        mediaId: item.mediaId,
      })
    ) {
      return;
    }
    const objectKey = (item.objectKey || item.mediaId || '').trim();
    const url = (item.url || '').trim();
    if (!objectKey && !url) return;

    void deleteMediaFile(url, objectKey || undefined).catch((cleanupError) => {
      if (cleanupError instanceof MediaApiError && cleanupError.errorCode === 'AUTH_REQUIRED') {
        setCleanupWarning(
          '초대장은 저장되었습니다. 저장소 정리를 위해 다시 로그인해 주세요.'
        );
        return;
      }
      setCleanupWarning(
        '저장 완료. 저장소 파일 정리는 나중에 다시 시도됩니다.'
      );
    });
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
    setUploadQueue((prev) => [...prev.filter((item) => item.status === 'error'), ...queuedItems].slice(-30));

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
      const previousImages = toEditorImages(
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
      await commitImages(nextImages, previousImages);
    }
    setError(firstError);
    setUploading(false);
    setUploadQueue((prev) => prev.filter((item) => item.status === 'error'));
  };

  const handleAddFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    await enqueueAndUpload(files);
    event.target.value = '';
  };

  const handleRemove = async (index: number) => {
    const target = visibleImages[index];
    if (!target) return;

    const previousImages = visibleImages;
    const nextImages = visibleImages.filter((_, idx) => idx !== index);
    setCleanupWarning(null);

    const saved = await commitImages(nextImages, previousImages);
    if (!saved) {
      return;
    }

    cleanupRemoteAsset(target);
  };

  const handleMove = async (from: number, to: number) => {
    if (to < 0 || to >= visibleImages.length) return;
    const previousImages = visibleImages;
    const nextImages = [...visibleImages];
    const [moved] = nextImages.splice(from, 1);
    nextImages.splice(to, 0, moved);
    await commitImages(nextImages, previousImages);
  };

  const handleDismissQueueItem = (itemId: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== itemId));
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
        {persistStatus === 'saving' ? (
          <p className={styles.fieldDescription} data-testid="gallery-persist-status">
            삭제됨 · 저장 중…
          </p>
        ) : null}
        {persistStatus === 'saved' ? (
          <p className={styles.fieldDescription} data-testid="gallery-persist-status">
            저장 완료
          </p>
        ) : null}
        {activeQueue.length > 0 && (
          <div className={styles.uploadQueue} data-testid="gallery-upload-queue">
            {activeQueue.map((item) => (
              <div
                key={item.id}
                className={styles.uploadQueueItem}
                data-testid="upload-queue-item"
                data-upload-status={item.status}
              >
                <div className={styles.uploadQueueMeta}>
                  <span className={styles.editorGalleryFileName}>{item.fileName}</span>
                  <span>
                    {item.status === 'error' ? '실패' : `${item.progress}%`}
                  </span>
                </div>
                {item.status !== 'error' ? (
                  <div className={styles.uploadProgressTrack}>
                    <div
                      className={styles.uploadProgressBar}
                      style={{ width: `${item.progress}%` }}
                      data-testid="upload-progress-bar"
                    />
                  </div>
                ) : null}
                {item.error && <p className={styles.fieldDescription}>{item.error}</p>}
                {item.status === 'error' ? (
                  <div className={styles.editorGalleryItemActions}>
                    <button
                      type="button"
                      className={styles.editorGalleryActionButton}
                      onClick={() => handleDismissQueueItem(item.id)}
                    >
                      제거
                    </button>
                  </div>
                ) : null}
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
            className={styles.editorGalleryList}
            data-testid="gallery-editor-list"
            data-gallery-count={visibleImages.length}
          >
            {visibleImages.map((image, index) => {
              const fileName = image.name || `gallery-${index + 1}`;
              return (
                <li
                  key={image.id}
                  className={styles.editorGalleryItemCard}
                  data-testid="gallery-editor-item"
                >
                  <button
                    type="button"
                    className={styles.editorGalleryThumbnail}
                    data-testid="gallery-editor-thumbnail"
                    aria-label={`${fileName} 원본 보기`}
                    onClick={() => setPreviewTarget({ url: image.url, name: fileName })}
                  >
                    <AppImage
                      src={image.url}
                      alt={fileName}
                      width={96}
                      height={112}
                      className={styles.editorGalleryThumbnailImg}
                    />
                  </button>
                  <div className={styles.editorGalleryItemMeta}>
                    <p className={styles.editorGalleryFileName} title={fileName}>
                      {fileName}
                    </p>
                    <p className={styles.editorGalleryItemStatus}>
                      <span className={styles.editorGalleryDoneBadge}>✓ 업로드 완료</span>
                      <span aria-hidden>·</span>
                      <span>{index + 1}번째 이미지</span>
                    </p>
                    <div className={styles.editorGalleryItemActions}>
                      <button
                        type="button"
                        className={styles.editorGalleryActionButton}
                        onClick={() => void handleMove(index, index - 1)}
                        disabled={index === 0 || persistStatus === 'saving'}
                        aria-label="위로 이동"
                        data-testid="gallery-editor-move-up"
                      >
                        위로
                      </button>
                      <button
                        type="button"
                        className={styles.editorGalleryActionButton}
                        onClick={() => void handleMove(index, index + 1)}
                        disabled={index === visibleImages.length - 1 || persistStatus === 'saving'}
                        aria-label="아래로 이동"
                        data-testid="gallery-editor-move-down"
                      >
                        아래로
                      </button>
                      <button
                        type="button"
                        className={styles.editorGalleryDeleteButton}
                        onClick={() => void handleRemove(index)}
                        disabled={uploading || persistStatus === 'saving'}
                        data-testid="gallery-editor-delete"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {previewTarget ? (
        <div
          className={styles.editorGalleryLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="갤러리 원본 보기"
          data-testid="gallery-editor-lightbox"
          onClick={() => setPreviewTarget(null)}
        >
          <div
            className={styles.editorGalleryLightboxPanel}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.editorGalleryLightboxClose}
              onClick={() => setPreviewTarget(null)}
              aria-label="닫기"
            >
              닫기
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewTarget.url}
              alt={previewTarget.name}
              className={styles.editorGalleryLightboxImage}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
