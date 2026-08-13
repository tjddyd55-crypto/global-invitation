'use client';

import DateTimeLocalField from '@/src/editors/shared/DateTimeLocalField';
import { invitationT } from '@/src/i18n/invitationT';
import type { ProductLocaleId } from '@/src/i18n/productLocales';
import styles from '../weddingEditor.module.css';
import type {
  WeddingEditorBasic,
  WeddingEditorSetup,
} from '../state/weddingEditor.types';

type Step1BasicInfoProps = {
  value: WeddingEditorBasic;
  conceptType: WeddingEditorSetup['conceptType'];
  locale?: ProductLocaleId;
  onChange: (value: Partial<WeddingEditorBasic>) => void;
};

/**
 * 기본 정보 Step.
 * GENERAL/WEDDING 모두 title·subtitle·eventDateTime·venueName·venueDetail 동일 SSOT.
 */
export default function Step1BasicInfo({
  value,
  conceptType,
  locale = 'ko-KR',
  onChange,
}: Step1BasicInfoProps) {
  const t = (key: string) => invitationT(locale, key);
  type BasicStepLabel = {
    title: string;
    subtitle: string;
    titlePlaceholder: string;
    subtitlePlaceholder: string;
    datetime: string;
    venue: string;
    detail: string;
    venuePlaceholder: string;
    detailPlaceholder: string;
  };

  const labels: BasicStepLabel =
    conceptType === 'FUNERAL'
      ? {
          title: t('editor.field.deceasedName'),
          subtitle: t('editor.field.chiefContact'),
          datetime: t('editor.field.funeralDate'),
          venue: t('editor.field.wakeLocation'),
          detail: t('editor.field.extraInfo'),
          titlePlaceholder: t('editor.placeholder.funeralTitle'),
          subtitlePlaceholder: t('editor.placeholder.funeralContact'),
          venuePlaceholder: t('editor.placeholder.wake'),
          detailPlaceholder: t('editor.placeholder.funeralNote'),
        }
      : conceptType === 'GENERAL' || conceptType === 'ORGANIZATION'
        ? {
            title: t('editor.field.eventTitle'),
            subtitle: t('editor.field.eventSubtitle'),
            datetime: t('editor.field.eventDateTime'),
            venue: t('editor.field.venue'),
            detail: t('editor.field.hallDetail'),
            titlePlaceholder:
              conceptType === 'ORGANIZATION' ? t('editor.placeholder.orgTitle') : t('editor.placeholder.generalTitle'),
            subtitlePlaceholder:
              conceptType === 'ORGANIZATION'
                ? t('editor.placeholder.orgSubtitle')
                : t('editor.placeholder.generalSubtitle'),
            venuePlaceholder: t('editor.placeholder.venue'),
            detailPlaceholder: t('editor.placeholder.hall'),
          }
        : {
            title: t('editor.field.weddingTitle'),
            subtitle: t('editor.field.weddingSubtitle'),
            datetime: t('editor.field.weddingDateTime'),
            venue: t('editor.field.venue'),
            detail: t('editor.field.hallDetail'),
            titlePlaceholder: t('editor.placeholder.weddingTitle'),
            subtitlePlaceholder: t('editor.placeholder.weddingSubtitle'),
            venuePlaceholder: t('editor.placeholder.weddingVenue'),
            detailPlaceholder: t('editor.placeholder.weddingHall'),
          };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.basic.heading')}</h2>
        <p>{t('editor.basic.desc')}</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.title}</span>
          <input
            type="text"
            value={value.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder={labels.titlePlaceholder}
            data-testid="basic-title-input"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.subtitle}</span>
          <input
            type="text"
            value={value.subtitle ?? ''}
            onChange={(event) => onChange({ subtitle: event.target.value })}
            placeholder={labels.subtitlePlaceholder}
          />
        </label>
        <DateTimeLocalField
          label={labels.datetime}
          value={value.eventDateTime}
          onChange={(next) => onChange({ eventDateTime: next })}
          required
          inputTestId="basic-datetime-input"
          buttonTestId="basic-datetime-picker-button"
        />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.venue}</span>
          <input
            type="text"
            value={value.venueName}
            onChange={(event) => onChange({ venueName: event.target.value })}
            placeholder={labels.venuePlaceholder}
            data-testid="basic-venue-input"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.detail}</span>
          <input
            type="text"
            value={value.venueDetail ?? ''}
            onChange={(event) => onChange({ venueDetail: event.target.value })}
            placeholder={labels.detailPlaceholder}
            data-testid="basic-venue-detail-input"
          />
        </label>
      </div>
    </section>
  );
}
