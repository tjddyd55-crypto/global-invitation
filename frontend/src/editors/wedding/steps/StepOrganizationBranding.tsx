'use client';
/* eslint-disable i18next/no-literal-string */

import {
  DEFAULT_BRAND_ACCENT_COLOR,
  normalizeBrandAccentColor,
  type OrganizationBranding,
} from '@/src/invitation/conceptTypes';
import ImageUploader from '../components/ImageUploader';
import { getOrganizationLogoUploadGuidance } from './organizationLogoUploadGuidance';
import styles from '../weddingEditor.module.css';

type StepOrganizationBrandingProps = {
  value: OrganizationBranding;
  onChange: (value: Partial<OrganizationBranding>) => void;
  onPersistClear?: () => Promise<void>;
};

export default function StepOrganizationBranding({
  value,
  onChange,
  onPersistClear,
}: StepOrganizationBrandingProps) {
  const accent = normalizeBrandAccentColor(value.accentColor);
  const logoGuidance = getOrganizationLogoUploadGuidance();

  return (
    <section className={styles.stepSection} data-testid="step-organization-branding">
      <div className={styles.sectionHeader}>
        <h2>기관 브랜딩</h2>
        <p>기관명·로고·브랜드 색상을 입력하면 초대장 상단에 반영됩니다.</p>
      </div>

      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>기관명</span>
          <input
            type="text"
            value={value.name ?? ''}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="예: 서울광진청년회의소"
            data-testid="organization-name-input"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>영문명 (선택)</span>
          <input
            type="text"
            value={value.englishName ?? ''}
            onChange={(event) => onChange({ englishName: event.target.value })}
            placeholder="예: JCI Seoul Gwangjin"
            data-testid="organization-english-name-input"
          />
        </label>
      </div>

      <ImageUploader
        label="로고"
        value={value.logo}
        onChange={(logo) => onChange({ logo })}
        onClear={() => onChange({ logo: '' })}
        onPersistClear={onPersistClear}
        uploadAssetType="asset"
        thumbnailRole="default"
        inputTestId="organization-logo-input"
        clearTestId="organization-logo-clear"
      />
      <p className={styles.helperText} data-testid="organization-logo-upload-guidance">
        {logoGuidance.primary}
        <br />
        {logoGuidance.secondary}
      </p>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>브랜드 색상</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="color"
            value={accent}
            onChange={(event) =>
              onChange({ accentColor: normalizeBrandAccentColor(event.target.value) })
            }
            aria-label="브랜드 색상"
            data-testid="organization-accent-color"
          />
          <input
            type="text"
            value={accent}
            onChange={(event) =>
              onChange({ accentColor: normalizeBrandAccentColor(event.target.value) })
            }
            placeholder={DEFAULT_BRAND_ACCENT_COLOR}
            style={{ maxWidth: 120 }}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onChange({ accentColor: DEFAULT_BRAND_ACCENT_COLOR })}
            data-testid="organization-accent-reset"
          >
            기본색으로
          </button>
        </div>
      </label>
    </section>
  );
}
