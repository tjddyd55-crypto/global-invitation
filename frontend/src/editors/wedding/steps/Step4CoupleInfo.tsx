'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import { phonePlaceholder } from '@/src/i18n/productLocales';
import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorPerson } from '../state/weddingEditor.types';

type Step4CoupleInfoProps = {
  groom: WeddingEditorPerson;
  bride: WeddingEditorPerson;
  onGroomChange: (value: Partial<WeddingEditorPerson>) => void;
  onBrideChange: (value: Partial<WeddingEditorPerson>) => void;
  onPersistGroomClear?: () => Promise<void>;
  onPersistBrideClear?: () => Promise<void>;
};

export default function Step4CoupleInfo({
  groom,
  bride,
  onGroomChange,
  onBrideChange,
  onPersistGroomClear,
  onPersistBrideClear,
}: Step4CoupleInfoProps) {
  const { t, locale } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.couple.heading')}</h2>
        <p>{t('editor.couple.desc')}</p>
      </div>
      <div className={styles.coupleEditorGrid}>
        <div className={styles.coupleEditorColumn}>
          <h3 className={styles.subSectionTitle}>{t('editor.couple.groom')}</h3>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.couple.name')}</span>
            <input
              type="text"
              value={groom.name}
              onChange={(event) => onGroomChange({ name: event.target.value })}
              placeholder={t('editor.couple.groomNamePlaceholder')}
              required
            />
          </label>
          <ImageUploader
            label={t('editor.couple.photoOptional')}
            value={groom.photo}
            uploadAssetType="groom"
            thumbnailRole="couple"
            onChange={(photo) => onGroomChange({ photo })}
            onClear={() => onGroomChange({ photo: '' })}
            onPersistClear={onPersistGroomClear}
            clearTestId="groom-image-clear"
            inputTestId="groom-upload-input"
          />
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.couple.phoneOptional')}</span>
            <input
              type="text"
              value={groom.phone ?? ''}
              onChange={(event) => onGroomChange({ phone: event.target.value })}
              placeholder={phonePlaceholder(locale)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.couple.parentsOptional')}</span>
            <input
              type="text"
              value={groom.parentsText ?? ''}
              onChange={(event) => onGroomChange({ parentsText: event.target.value })}
              placeholder={t('editor.couple.groomParentsPlaceholder')}
            />
          </label>
        </div>
        <div className={styles.coupleEditorColumn}>
          <h3 className={styles.subSectionTitle}>{t('editor.couple.bride')}</h3>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.couple.name')}</span>
            <input
              type="text"
              value={bride.name}
              onChange={(event) => onBrideChange({ name: event.target.value })}
              placeholder={t('editor.couple.brideNamePlaceholder')}
              required
            />
          </label>
          <ImageUploader
            label={t('editor.couple.photoOptional')}
            value={bride.photo}
            uploadAssetType="bride"
            thumbnailRole="couple"
            onChange={(photo) => onBrideChange({ photo })}
            onClear={() => onBrideChange({ photo: '' })}
            onPersistClear={onPersistBrideClear}
            clearTestId="bride-image-clear"
            inputTestId="bride-upload-input"
          />
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.couple.phoneOptional')}</span>
            <input
              type="text"
              value={bride.phone ?? ''}
              onChange={(event) => onBrideChange({ phone: event.target.value })}
              placeholder={phonePlaceholder(locale)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.couple.parentsOptional')}</span>
            <input
              type="text"
              value={bride.parentsText ?? ''}
              onChange={(event) => onBrideChange({ parentsText: event.target.value })}
              placeholder={t('editor.couple.brideParentsPlaceholder')}
            />
          </label>
        </div>
      </div>
      <div className={styles.noticeBox}>{t('editor.couple.mobileNotice')}</div>
    </section>
  );
}
