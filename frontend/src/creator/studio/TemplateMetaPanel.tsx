'use client';
/* eslint-disable i18next/no-literal-string */

import type { CreatorActiveCategory } from '@/src/creator/studioConfig';
import { useI18n } from '@/src/contexts/I18nContext';
import { getStudioSectionLabel } from './sectionLabels';
import styles from './TemplateCreatorStudio.module.css';

export type TemplateMetaValue = {
  name: string;
  description: string;
  style: string;
  price: number;
  previewThumbnailUrl: string;
  templateKeyCandidate: string;
};

type TemplateMetaPanelProps = {
  category: CreatorActiveCategory;
  value: TemplateMetaValue;
  sectionKeys: string[];
  uploadingThumbnail: boolean;
  onChange: (next: Partial<TemplateMetaValue>) => void;
  onNavigateSection: (sectionKey: string) => void;
  onThumbnailUpload: (file: File) => Promise<void>;
};

const STYLE_OPTIONS = ['modern', 'korean', 'japanese', 'western', 'traditional'];

export default function TemplateMetaPanel({
  category,
  value,
  sectionKeys,
  uploadingThumbnail,
  onChange,
  onNavigateSection,
  onThumbnailUpload,
}: TemplateMetaPanelProps) {
  const { language } = useI18n();

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Template Metadata</h2>
      <div className={styles.stack}>
        <label className={styles.field}>
          <span>Category</span>
          <input value={category} disabled />
        </label>
        <label className={styles.field}>
          <span>Template name</span>
          <input
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="My Wedding Template"
          />
        </label>
        <label className={styles.field}>
          <span>Description</span>
          <textarea
            value={value.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="템플릿 설명을 입력하세요."
          />
        </label>
        <div className={styles.inlineGrid}>
          <label className={styles.field}>
            <span>Style tag</span>
            <select
              value={value.style}
              onChange={(e) => onChange({ style: e.target.value })}
            >
              {STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Price</span>
            <input
              type="number"
              min={0}
              value={value.price}
              onChange={(e) => onChange({ price: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
        <label className={styles.field}>
          <span>Template key candidate</span>
          <input
            value={value.templateKeyCandidate}
            onChange={(e) => onChange({ templateKeyCandidate: e.target.value })}
            placeholder="my_wedding_style"
          />
        </label>
        <label className={styles.field}>
          <span>Preview thumbnail URL</span>
          <input
            value={value.previewThumbnailUrl}
            onChange={(e) => onChange({ previewThumbnailUrl: e.target.value })}
            placeholder="https://.../thumbnail.jpg"
          />
        </label>
        <label className={styles.field}>
          <span>Preview thumbnail upload</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void onThumbnailUpload(file);
            }}
            disabled={uploadingThumbnail}
          />
          <span className={styles.helperText}>{uploadingThumbnail ? 'Uploading...' : 'JPG/PNG/WEBP up to 10MB'}</span>
        </label>

        <div className={styles.field}>
          <span>Section navigation</span>
          <div className={styles.buttonRow}>
            {sectionKeys.map((section) => (
              <button
                key={section}
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => onNavigateSection(section)}
              >
                {getStudioSectionLabel(section, language)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
