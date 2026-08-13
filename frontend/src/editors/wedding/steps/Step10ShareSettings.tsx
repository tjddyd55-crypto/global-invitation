'use client';
/* eslint-disable i18next/no-literal-string */

import ImageUploader from '../components/ImageUploader';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorShare } from '../state/weddingEditor.types';
import InvitationShareCardPreview from '@/src/components/share/InvitationShareCardPreview';
import type { InvitationSharePreviewModel } from '@/src/invitation/sharePreviewModel';
import { deleteMediaFile } from '@/src/lib/mediaApi';
import { persistThenDeleteMedia } from '../lib/persistThenDeleteMedia';
import { useState } from 'react';

type Step10ShareSettingsProps = {
  value: WeddingEditorShare;
  onChange: (value: Partial<WeddingEditorShare>) => void;
  /** 이미지 모드 변경 후 즉시 PATCH */
  onPersistShareChange?: (next: Partial<WeddingEditorShare>) => Promise<void>;
  heroImage: string;
  /** Mobile: 폼 아래 카드. Desktop: 우측 컬럼에서 표시하므로 false */
  showInlineShareCardPreview?: boolean;
  sharePreviewModel?: InvitationSharePreviewModel | null;
  persistingShareImage?: boolean;
};

export default function Step10ShareSettings({
  value,
  onChange,
  onPersistShareChange,
  heroImage,
  showInlineShareCardPreview = false,
  sharePreviewModel,
  persistingShareImage,
}: Step10ShareSettingsProps) {
  const { t } = useInvitationT();
  const hero = (heroImage || '').trim();
  const hasHero = Boolean(hero);
  const [clearError, setClearError] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const [clearingExtra, setClearingExtra] = useState(false);

  const customShareUrl = value.ogImageMode === 'CUSTOM' ? (value.ogImage || '').trim() : '';
  const shouldDeleteCustomShare = Boolean(customShareUrl) && customShareUrl !== hero;

  const applySharePatch = async (patch: Partial<WeddingEditorShare>) => {
    onChange(patch);
    if (onPersistShareChange) {
      await onPersistShareChange(patch);
    }
  };

  const clearShareImage = async (options?: { fromUploader?: boolean }) => {
    const previous = {
      ogImage: value.ogImage,
      ogImageMode: value.ogImageMode,
    };
    const next = { ogImage: '', ogImageMode: 'NONE' as const };
    const remoteUrl = shouldDeleteCustomShare ? customShareUrl : '';

    setClearError(null);
    setCleanupWarning(null);
    if (!options?.fromUploader) setClearingExtra(true);

    const status = await persistThenDeleteMedia({
      applyDraftRemoval: () => onChange(next),
      rollbackDraft: () => onChange(previous),
      persistDraft: async () => {
        if (onPersistShareChange) {
          await onPersistShareChange(next);
        }
      },
      deleteRemote: remoteUrl
        ? async () => {
            await deleteMediaFile(remoteUrl);
          }
        : null,
    });

    if (status === 'persist_failed') {
      setClearError(t('editor.upload.saveFailed'));
    } else if (status === 'delete_failed') {
      setCleanupWarning(t('editor.upload.cleanupLater'));
    }

    if (!options?.fromUploader) setClearingExtra(false);
    return status;
  };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.sharing')}</h2>
        <p>{t('editor.share.desc')}</p>
      </div>
      <div className={styles.ogEditor}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.share.ogTitle')}</span>
          <span className={styles.fieldDescription}>{t('editor.share.ogTitleHint')}</span>
          <input
            type="text"
            value={value.ogTitle}
            onChange={(event) => onChange({ ogTitle: event.target.value })}
            placeholder={t('editor.share.titlePlaceholder')}
            data-testid="og-title-input"
            maxLength={80}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.share.ogDesc')}</span>
          <span className={styles.fieldDescription}>{t('editor.share.ogDescHint')}</span>
          <textarea
            rows={3}
            value={value.ogDescription}
            onChange={(event) => onChange({ ogDescription: event.target.value })}
            placeholder={t('editor.share.descPlaceholder')}
            data-testid="og-description-input"
            maxLength={160}
          />
        </label>
        <ImageUploader
          label={t('editor.share.previewImage')}
          description={t('editor.share.previewImageDesc')}
          value={value.ogImageMode === 'NONE' ? '' : value.ogImage}
          onChange={(next) => {
            void applySharePatch({
              ogImage: next,
              ogImageMode: next.trim() ? 'CUSTOM' : 'NONE',
            });
          }}
          onClear={() => {
            onChange({ ogImage: '', ogImageMode: 'NONE' });
          }}
          onPersistClear={async () => {
            if (onPersistShareChange) {
              await onPersistShareChange({ ogImage: '', ogImageMode: 'NONE' });
            }
          }}
          shouldDeleteRemote={shouldDeleteCustomShare}
          uploadAssetType="asset"
          thumbnailRole="openGraph"
          inputTestId="og-image-input"
          clearTestId="og-image-clear"
        />
        <div className={styles.uploaderActions}>
          <button
            type="button"
            className={styles.buttonSubtle}
            onClick={() => {
              if (!hasHero) return;
              void applySharePatch({ ogImage: hero, ogImageMode: 'HERO' });
            }}
            disabled={!hasHero || persistingShareImage || clearingExtra}
            data-testid="og-use-hero"
          >
            {t('editor.share.useHero')}
          </button>
          <button
            type="button"
            className={styles.buttonSubtle}
            onClick={() => {
              void clearShareImage();
            }}
            disabled={persistingShareImage || clearingExtra}
            data-testid="og-clear-image"
          >
            {clearingExtra ? t('editor.upload.removing') : t('editor.share.removeImage')}
          </button>
        </div>
        {!hasHero ? (
          <p className={styles.fieldDescription}>{t('editor.share.noHero')}</p>
        ) : null}
        {persistingShareImage || clearingExtra ? (
          <p className={styles.fieldDescription} data-testid="og-image-persisting">
            {t('editor.share.persisting')}
          </p>
        ) : null}
        {clearError ? (
          <p className={styles.fieldDescription} data-testid="og-image-error">
            {clearError}
          </p>
        ) : null}
        {cleanupWarning ? (
          <p className={styles.fieldDescription} data-testid="og-image-cleanup-warning">
            {cleanupWarning}
          </p>
        ) : null}
        {showInlineShareCardPreview && sharePreviewModel ? (
          <InvitationShareCardPreview
            key={`${sharePreviewModel.imageMode}:${sharePreviewModel.imageUrl || 'none'}`}
            title={sharePreviewModel.title}
            description={sharePreviewModel.description}
            imageUrl={sharePreviewModel.imageUrl}
            canonicalUrl={sharePreviewModel.canonicalUrl}
            displayUrl={sharePreviewModel.displayUrl}
            hasPublicUrl={sharePreviewModel.hasPublicUrl}
          />
        ) : null}
      </div>
    </section>
  );
}
