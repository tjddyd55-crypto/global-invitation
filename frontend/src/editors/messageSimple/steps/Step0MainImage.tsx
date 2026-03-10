'use client';

import { useState } from 'react';
import { deleteMediaFile, uploadMediaImage } from '@/src/lib/mediaApi';
import styles from '../messageSimpleEditor.module.css';

type Step0MainImageProps = {
  heroImage: string;
  onChange: (heroImage: string) => void;
};

function revokeIfObjectUrl(url?: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export default function Step0MainImage({ heroImage, onChange }: Step0MainImageProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      if (heroImage) {
        revokeIfObjectUrl(heroImage);
      }
      const uploaded = await uploadMediaImage(file, { assetType: 'hero' });
      onChange(uploaded.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleClear = async () => {
    if (!heroImage) return;

    setUploading(true);
    setError(null);

    try {
      await deleteMediaFile(heroImage);
      onChange('');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '이미지 삭제에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 0. 메인 이미지</h2>
        <p>카드 분위기를 결정하는 대표 이미지를 선택합니다.</p>
      </div>
      <div className={styles.uploader}>
        <div className={styles.uploaderBody}>
          {heroImage ? (
            <div className={styles.uploaderPreview}>
              <img src={heroImage} alt="main preview" />
            </div>
          ) : (
            <div className={styles.uploaderPlaceholder}>이미지를 선택하세요.</div>
          )}
          <div className={styles.uploaderActions}>
            <label className={styles.buttonGhost}>
              {uploading ? '업로드 중...' : '이미지 선택'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.hiddenInput}
                onChange={(event) => void handleFileChange(event)}
                disabled={uploading}
              />
            </label>
            {heroImage && (
              <button type="button" className={styles.buttonSubtle} onClick={() => void handleClear()} disabled={uploading}>
                제거
              </button>
            )}
          </div>
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
      </div>
    </section>
  );
}
