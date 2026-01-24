'use client';

import { useId } from 'react';
import styles from '../funeralEditor.module.css';

type ImageUploaderProps = {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
};

function revokeIfObjectUrl(url?: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export default function ImageUploader({ label, description, value, onChange, onClear }: ImageUploaderProps) {
  const inputId = useId();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (value) {
      revokeIfObjectUrl(value);
    }
    const url = URL.createObjectURL(file);
    onChange(url);
  };

  const handleClear = () => {
    if (!value) return;
    revokeIfObjectUrl(value);
    onClear?.();
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
        {value ? (
          <div className={styles.uploaderPreview}>
            <img src={value} alt={`${label} preview`} />
          </div>
        ) : (
          <div className={styles.uploaderPlaceholder}>이미지를 선택하세요.</div>
        )}
        <div className={styles.uploaderActions}>
          <label className={styles.buttonGhost} htmlFor={inputId}>
            이미지 선택
          </label>
          {value && (
            <button type="button" className={styles.buttonSubtle} onClick={handleClear}>
              제거
            </button>
          )}
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
