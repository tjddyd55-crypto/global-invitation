'use client';

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorHero } from '../state/weddingEditor.types';

type Step2HeroImageProps = {
  value: WeddingEditorHero;
  onChange: (value: Partial<WeddingEditorHero>) => void;
  onPersistClear?: () => Promise<void>;
};

/**
 * Figma Make Hero upload step — callout + dashed upload (4:3 / 10MB).
 */
export default function Step2HeroImage({ value, onChange, onPersistClear }: Step2HeroImageProps) {
  const { t } = useInvitationT();
  const [calloutLead, calloutRest] = t('editor.hero.calloutBody').split('\n');

  return (
    <section className={`${styles.stepSection} ${styles.stepSectionNoTitle}`}>
      <div className={styles.heroCallout}>
        <span className={styles.heroCalloutIcon} aria-hidden>
          🖼
        </span>
        <div>
          <p className={styles.heroCalloutTitle}>{t('editor.hero.calloutTitle')}</p>
          <p className={styles.heroCalloutBody}>
            {calloutLead}
            {calloutRest ? (
              <>
                <br />
                {calloutRest}
              </>
            ) : null}
          </p>
        </div>
      </div>

      <ImageUploader
        label={t('editor.upload.select')}
        description={t('editor.hero.desc')}
        value={value.heroImage}
        onChange={(heroImage) => onChange({ heroImage })}
        onClear={() => onChange({ heroImage: '' })}
        onPersistClear={onPersistClear}
        uploadAssetType="hero"
        thumbnailRole="hero"
        inputTestId="hero-upload-input"
        clearTestId="hero-image-clear"
        required
        priority
      />

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('editor.hero.overlay')}</span>
        <input
          type="text"
          value={value.overlayText ?? ''}
          onChange={(event) => onChange({ overlayText: event.target.value })}
          placeholder={t('editor.hero.overlayPlaceholder')}
        />
      </label>
    </section>
  );
}
