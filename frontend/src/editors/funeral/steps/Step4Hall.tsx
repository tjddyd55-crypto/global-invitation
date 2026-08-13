'use client';
/* eslint-disable i18next/no-literal-string */

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import { phonePlaceholder } from '@/src/i18n/productLocales';
import styles from '../funeralEditor.module.css';
import ImageUploader from '../components/ImageUploader';
import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';

type Step4HallProps = {
  funeralHall: FuneralInvitation['funeralHall'];
  contact?: FuneralInvitation['contact'];
  onHallChange: (hall: FuneralInvitation['funeralHall']) => void;
  onContactChange: (contact?: FuneralInvitation['contact']) => void;
};

export default function Step4Hall({ funeralHall, contact, onHallChange, onContactChange }: Step4HallProps) {
  const { t, locale } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.location')}</h2>
        <p>위치와 연락처 정보를 입력합니다.</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('editor.field.wakeLocation')}</span>
        <input
          type="text"
          value={funeralHall.name}
          onChange={(event) => onHallChange({ ...funeralHall, name: event.target.value })}
          placeholder={t('editor.placeholder.wake')}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>주소</span>
        <input
          type="text"
          value={funeralHall.address ?? ''}
          onChange={(event) => onHallChange({ ...funeralHall, address: event.target.value })}
          placeholder="예: 서울특별시 송파구 올림픽로 43길 88"
        />
      </label>
      <ImageUploader
        label={t('editor.section.location')}
        description={t('invitation.placeholder.location')}
        value={funeralHall.mapImage}
        onChange={(mapImage) => onHallChange({ ...funeralHall, mapImage })}
        onClear={() => onHallChange({ ...funeralHall, mapImage: '' })}
      />
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.field.chiefContact')}</span>
          <input
            type="text"
            value={contact?.name ?? ''}
            onChange={(event) => onContactChange({ ...(contact ?? { name: '', phone: '' }), name: event.target.value })}
            placeholder={t('editor.placeholder.funeralContact')}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.couple.phoneOptional')}</span>
          <input
            type="text"
            value={contact?.phone ?? ''}
            onChange={(event) => onContactChange({ ...(contact ?? { name: '', phone: '' }), phone: event.target.value })}
            placeholder={phonePlaceholder(locale)}
          />
        </label>
      </div>
    </section>
  );
}
