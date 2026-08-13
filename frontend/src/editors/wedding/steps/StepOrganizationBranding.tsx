'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import {
  DEFAULT_BRAND_ACCENT_COLOR,
  normalizeBrandAccentColor,
  type OrganizationBranding,
} from '@/src/invitation/conceptTypes';
import {
  listOrganizationPresets,
  normalizeOrganizationPresetId,
  type OrganizationPresetId,
} from '@/src/invitation/organizationPresets';
import { cdnImageSrc } from '@/src/lib/image';
import { deleteMediaFile } from '@/src/lib/mediaApi';
import { shouldDeleteRemoteGalleryAsset } from '@/src/invitation/galleryAsset';
import ImageUploader from '../components/ImageUploader';
import { getOrganizationLogoUploadGuidance } from './organizationLogoUploadGuidance';
import {
  applyOrganizationPreset,
  matchesOrganizationPresetDefaults,
  type OrganizationPresetMusicSnapshot,
} from '../lib/applyOrganizationPreset';
import { persistThenDeleteMedia } from '../lib/persistThenDeleteMedia';
import { invitationT } from '@/src/i18n/invitationT';
import type { ProductLocaleId } from '@/src/i18n/productLocales';
import styles from '../weddingEditor.module.css';

type StepOrganizationBrandingProps = {
  value: OrganizationBranding;
  music: OrganizationPresetMusicSnapshot;
  locale?: ProductLocaleId;
  onChange: (value: Partial<OrganizationBranding>) => void;
  onChangeMusic: (value: Partial<OrganizationPresetMusicSnapshot>) => void;
  onPersistClear?: () => Promise<void>;
  /** Persist full organization + music after preset apply (for lifecycle). */
  onPersistPresetApply?: (
    organization: OrganizationBranding,
    music: OrganizationPresetMusicSnapshot
  ) => Promise<void>;
};

export default function StepOrganizationBranding({
  value,
  music,
  locale = 'ko-KR',
  onChange,
  onChangeMusic,
  onPersistClear,
  onPersistPresetApply,
}: StepOrganizationBrandingProps) {
  const t = (key: string, vars?: Record<string, string | number>) => invitationT(locale, key, vars);
  const accent = normalizeBrandAccentColor(value.accentColor);
  const logoGuidance = getOrganizationLogoUploadGuidance(locale);
  const selectedPreset = normalizeOrganizationPresetId(value.presetId);
  const presets = listOrganizationPresets();
  const [pendingJciConfirm, setPendingJciConfirm] = useState(false);
  const [applying, setApplying] = useState(false);

  const applyPreset = async (presetId: OrganizationPresetId) => {
    if (applying) return;
    const result = applyOrganizationPreset({
      presetId,
      organization: value,
      music,
    });

    if (presetId === 'CUSTOM') {
      onChange({ presetId: 'CUSTOM' });
      return;
    }

    setApplying(true);
    const previousLogo = result.previousLogo;
    const shouldDeletePrevious = shouldDeleteRemoteGalleryAsset({ url: previousLogo });

    const status = await persistThenDeleteMedia({
      applyDraftRemoval: () => {
        onChange(result.organization);
        onChangeMusic(result.music);
      },
      rollbackDraft: () => {
        onChange(value);
        onChangeMusic(music);
      },
      persistDraft: async () => {
        if (onPersistPresetApply) {
          await onPersistPresetApply(result.organization, result.music);
        }
      },
      deleteRemote:
        shouldDeletePrevious && previousLogo
          ? async () => {
              await deleteMediaFile(previousLogo);
            }
          : null,
    });

    setApplying(false);
    if (status === 'persist_failed') {
      // rollback already applied by helper
      return;
    }
  };

  const handleSelectPreset = (presetId: OrganizationPresetId) => {
    if (presetId === selectedPreset && presetId === 'CUSTOM') return;
    if (presetId === 'CUSTOM') {
      void applyPreset('CUSTOM');
      return;
    }
    if (presetId === 'JCI') {
      const alreadyDefaults = matchesOrganizationPresetDefaults('JCI', value, music);
      const hasDifferentAssets =
        selectedPreset === 'JCI'
          ? !alreadyDefaults
          : Boolean((value.logo || '').trim() || music.musicEnabled || music.musicTrackId);
      if (hasDifferentAssets && !alreadyDefaults) {
        setPendingJciConfirm(true);
        return;
      }
      void applyPreset('JCI');
    }
  };

  return (
    <section className={styles.stepSection} data-testid="step-organization-branding">
      <div className={styles.sectionHeader}>
        <h2>{t('editor.org.heading')}</h2>
        <p>{t('editor.org.desc')}</p>
      </div>

      <div className={styles.presetBlock} data-testid="organization-preset-selector">
        <span className={styles.fieldLabel} id="organization-preset-label">
          {t('editor.org.preset')}
        </span>
        <div
          className={styles.presetGrid}
          role="radiogroup"
          aria-labelledby="organization-preset-label"
        >
          {presets.map((preset) => {
            const selected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.label}
                disabled={applying}
                className={`${styles.presetCard} ${selected ? styles.presetCardSelected : ''}`}
                data-testid={`organization-preset-${preset.id.toLowerCase()}`}
                onClick={() => handleSelectPreset(preset.id)}
              >
                <span className={styles.presetCardMedia}>
                  {preset.logoKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cdnImageSrc(preset.logoKey)}
                      alt=""
                      className={styles.presetCardLogo}
                    />
                  ) : (
                    <span className={styles.presetCardIcon} aria-hidden>
                      +
                    </span>
                  )}
                </span>
                <span className={styles.presetCardLabel}>{preset.label}</span>
                {preset.description ? (
                  <span className={styles.presetCardHint}>{preset.description}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {pendingJciConfirm ? (
        <div
          className={styles.presetConfirm}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="jci-preset-confirm-title"
          data-testid="organization-preset-jci-confirm"
        >
          <h3 id="jci-preset-confirm-title">{t('editor.org.jciConfirmTitle')}</h3>
          <p>{t('editor.org.jciConfirmDesc')}</p>
          <div className={styles.presetConfirmActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setPendingJciConfirm(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              data-testid="organization-preset-jci-confirm-apply"
              onClick={() => {
                setPendingJciConfirm(false);
                void applyPreset('JCI');
              }}
            >
              적용
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.field.organizationName')}</span>
          <input
            type="text"
            value={value.name ?? ''}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={locale === 'en-US' ? 'e.g. JCI Seoul Gwangjin' : '예: 서울광진청년회의소'}
            data-testid="organization-name-input"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.field.secondaryName')}</span>
          <input
            type="text"
            value={value.englishName ?? ''}
            onChange={(event) => onChange({ englishName: event.target.value })}
            placeholder="e.g. JCI Seoul Gwangjin"
            data-testid="organization-english-name-input"
          />
        </label>
      </div>

      <ImageUploader
        label={t('editor.field.logo')}
        value={value.logo}
        onChange={(logo) => onChange({ logo })}
        onClear={() => onChange({ logo: '' })}
        onPersistClear={onPersistClear}
        uploadAssetType="asset"
        thumbnailRole="logo"
        inputTestId="organization-logo-input"
        clearTestId="organization-logo-clear"
      />
      <p className={styles.helperText} data-testid="organization-logo-upload-guidance">
        {logoGuidance.primary}
        <br />
        {logoGuidance.secondary}
      </p>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('editor.org.brandColor')}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="color"
            value={accent}
            onChange={(event) =>
              onChange({ accentColor: normalizeBrandAccentColor(event.target.value) })
            }
            aria-label={t('editor.org.brandColor')}
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
