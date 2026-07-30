'use client';
/* eslint-disable i18next/no-literal-string */

import { FormEvent, useState } from 'react';
import {
  confirmAdminMusic,
  presignAdminMusic,
  type AdminMusicCategory,
} from '@/src/shared/api';
import {
  resolveAdminMusicContentType,
  uploadAdminMusicObject,
  validateAdminMusicFile,
} from './adminMusicUpload';
import styles from './AdminMusicLibraryPage.module.css';

const CATEGORY_OPTIONS: AdminMusicCategory[] = ['COMMON', 'WEDDING', 'FUNERAL', 'GENERAL'];

type UploadFormState = {
  title: string;
  artistName: string;
  category: AdminMusicCategory;
  description: string;
  licenseType: string;
  licenseSource: string;
  licenseSourceUrl: string;
  attributionText: string;
  commercialUseConfirmed: boolean;
  isActive: boolean;
  sortOrder: string;
};

const INITIAL_FORM: UploadFormState = {
  title: '',
  artistName: '',
  category: 'COMMON',
  description: '',
  licenseType: '',
  licenseSource: '',
  licenseSourceUrl: '',
  attributionText: '',
  commercialUseConfirmed: false,
  isActive: false,
  sortOrder: '0',
};

export default function AdminMusicUploadForm({ onUploaded }: { onUploaded: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof UploadFormState>(key: K, value: UploadFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const fileError = validateAdminMusicFile(file);
    if (fileError) return fileError;
    if (!form.title.trim()) return '제목을 입력해 주세요.';
    if (form.isActive && !form.commercialUseConfirmed) {
      return '활성화하려면 상업적 이용 권한을 확인해야 합니다.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError || !file) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setProgress(0);
    try {
      const contentType = resolveAdminMusicContentType(file);
      if (!contentType) throw new Error('지원하지 않는 음원 형식입니다.');
      const presigned = await presignAdminMusic({
        contentType,
        filename: file.name,
        fileSize: file.size,
        category: form.category,
      });
      await uploadAdminMusicObject({
        uploadUrl: presigned.uploadUrl,
        file,
        contentType,
        headers: presigned.headers,
        onProgress: setProgress,
      });
      await confirmAdminMusic({
        objectKey: presigned.objectKey,
        title: form.title.trim(),
        artistName: form.artistName.trim() || null,
        category: form.category,
        description: form.description.trim() || null,
        originalFilename: file.name,
        mimeType: contentType,
        fileSize: file.size,
        licenseType: form.licenseType.trim() || null,
        licenseSource: form.licenseSource.trim() || null,
        licenseSourceUrl: form.licenseSourceUrl.trim() || null,
        attributionText: form.attributionText.trim() || null,
        attributionRequired: Boolean(form.attributionText.trim()),
        commercialUseConfirmed: form.commercialUseConfirmed,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      });
      setFile(null);
      setForm(INITIAL_FORM);
      setProgress(null);
      await onUploaded();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '음원 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.panel}>
      <h2>음원 등록</h2>
      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <div className={styles.fieldGrid}>
          <label>파일 (MP3/M4A/AAC, 최대 20MB)<input type="file" accept=".mp3,.m4a,.aac,audio/mpeg,audio/mp4,audio/aac,audio/x-m4a" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
          <label>제목 *<input value={form.title} onChange={(event) => setField('title', event.target.value)} /></label>
          <label>아티스트<input value={form.artistName} onChange={(event) => setField('artistName', event.target.value)} /></label>
          <label>카테고리<select value={form.category} onChange={(event) => setField('category', event.target.value as AdminMusicCategory)}>{CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>라이선스 유형<input value={form.licenseType} onChange={(event) => setField('licenseType', event.target.value)} /></label>
          <label>라이선스 출처<input value={form.licenseSource} onChange={(event) => setField('licenseSource', event.target.value)} /></label>
          <label>라이선스 URL<input type="url" value={form.licenseSourceUrl} onChange={(event) => setField('licenseSourceUrl', event.target.value)} /></label>
          <label>정렬 순서<input type="number" min="0" value={form.sortOrder} onChange={(event) => setField('sortOrder', event.target.value)} /></label>
        </div>
        <label>설명<textarea rows={3} value={form.description} onChange={(event) => setField('description', event.target.value)} /></label>
        <label>저작자 표시 문구<input value={form.attributionText} onChange={(event) => setField('attributionText', event.target.value)} /></label>
        <div className={styles.checkboxRow}>
          <label><input type="checkbox" checked={form.commercialUseConfirmed} onChange={(event) => setField('commercialUseConfirmed', event.target.checked)} /> 상업적 이용 권한을 확인했습니다.</label>
          <label><input type="checkbox" checked={form.isActive} onChange={(event) => setField('isActive', event.target.checked)} /> 등록 즉시 활성화</label>
        </div>
        {progress !== null ? <progress max="100" value={progress}>{progress}%</progress> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? `업로드 중 ${progress ?? 0}%` : '음원 등록'}
        </button>
      </form>
    </section>
  );
}
