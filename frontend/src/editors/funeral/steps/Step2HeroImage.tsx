'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../funeralEditor.module.css';
import ImageUploader from '../components/ImageUploader';

type Step2HeroImageProps = {
  heroImage?: string;
  onChange: (heroImage: string) => void;
};

export default function Step2HeroImage({ heroImage, onChange }: Step2HeroImageProps) {
  const { t } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.hero')}</h2>
        <p>{t('editor.hero.desc')}</p>
      </div>
      <ImageUploader
        label={t('editor.section.hero')}
        description={t('editor.hero.desc')}
        value={heroImage}
        onChange={onChange}
        onClear={() => onChange('')}
        uploadAssetType="hero"
        priority
      />
    </section>
  );
}
