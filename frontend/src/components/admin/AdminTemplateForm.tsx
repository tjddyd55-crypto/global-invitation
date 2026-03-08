'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import type { AdminTemplatePayload } from '@/src/lib/adminApi';
import {
  calculateTemplateRevenue,
  type TemplateCategory,
  type TemplateDefinition,
  type TemplateStyle,
} from '@/src/templates/registry';
import styles from './AdminShell.module.css';

type AdminTemplateFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: Partial<AdminTemplatePayload>;
  onSubmit: (payload: AdminTemplatePayload) => Promise<void>;
};

const CATEGORY_OPTIONS: Array<{ value: TemplateCategory; label: string }> = [
  { value: 'wedding', label: '웨딩' },
  { value: 'birthday', label: '돌잔치' },
  { value: 'funeral', label: '장례식' },
  { value: 'party', label: '파티' },
];

const STYLE_OPTIONS: Array<{ value: TemplateStyle; label: string }> = [
  { value: 'korean', label: '한국식' },
  { value: 'japanese', label: '일본식' },
  { value: 'western', label: '서양식' },
  { value: 'traditional', label: '전통' },
  { value: 'modern', label: '모던' },
];

const DEFAULT_FORM_STATE: AdminTemplatePayload = {
  name: '',
  category: 'wedding',
  style: 'korean',
  description: '',
  price: 50,
  creatorShare: 20,
  creatorId: '',
  component: 'WeddingClassicTemplate',
  templateKey: 'wedding_classic',
};

export default function AdminTemplateForm({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: AdminTemplateFormProps) {
  const [form, setForm] = useState<AdminTemplatePayload>({
    ...DEFAULT_FORM_STATE,
    ...initialValue,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revenue = useMemo(
    () => calculateTemplateRevenue(form.price, form.creatorShare),
    [form.price, form.creatorShare]
  );

  const handleChange = <K extends keyof AdminTemplatePayload>(key: K, value: AdminTemplatePayload[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        creatorId: form.creatorId?.trim() ? form.creatorId.trim() : undefined,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.pageDescription}>{description}</p>
        </div>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="template-name">Template Name</label>
            <input
              id="template-name"
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="template-category">Category</label>
            <select
              id="template-category"
              value={form.category}
              onChange={(event) => handleChange('category', event.target.value as TemplateDefinition['category'])}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="template-style">Style</label>
            <select
              id="template-style"
              value={form.style}
              onChange={(event) => handleChange('style', event.target.value as TemplateDefinition['style'])}
            >
              {STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="template-price">Price (USD)</label>
            <input
              id="template-price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(event) => handleChange('price', Number(event.target.value))}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="template-share">Creator Share (%)</label>
            <input
              id="template-share"
              type="number"
              min={0}
              max={100}
              step="1"
              value={form.creatorShare}
              onChange={(event) => handleChange('creatorShare', Number(event.target.value))}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="template-creator-id">Creator ID (optional)</label>
            <input
              id="template-creator-id"
              value={form.creatorId || ''}
              onChange={(event) => handleChange('creatorId', event.target.value)}
            />
            <span className={styles.helperText}>입력하면 CREATOR TEMPLATE로 분류됩니다.</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="template-component">Template Component Name</label>
            <input
              id="template-component"
              value={form.component}
              onChange={(event) => handleChange('component', event.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="template-key">Template Key</label>
            <input
              id="template-key"
              value={form.templateKey}
              onChange={(event) => handleChange('templateKey', event.target.value)}
              required
            />
            <span className={styles.helperText}>현재 editor/preview에서 지원하는 key와 맞춰야 합니다.</span>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="template-description">Template Description</label>
          <textarea
            id="template-description"
            value={form.description}
            onChange={(event) => handleChange('description', event.target.value)}
            required
          />
        </div>

        <div className={styles.card}>
          <div className={styles.metricLabel}>수익 구조 미리보기</div>
          <p className={styles.metricValue}>${revenue.price.toFixed(2)}</p>
          <p className={styles.helperText}>
            Creator Earnings: ${revenue.creatorEarnings.toFixed(2)} / Platform Earnings: $
            {revenue.platformEarnings.toFixed(2)}
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? '저장 중...' : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
