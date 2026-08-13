'use client';

import DateTimeLocalField from '@/src/editors/shared/DateTimeLocalField';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorBasic } from '../state/weddingEditor.types';

type Step3ScheduleInfoProps = {
  value: WeddingEditorBasic;
  onChange: (value: Partial<WeddingEditorBasic>) => void;
};

/**
 * FUNERAL 장례 일정 Step (GENERAL은 기본 정보에 통합 — visible step 목록에 없음).
 * Step1 기본 정보와 동일한 WeddingEditorBasic SSOT 를 편집한다 (중복 state 금지).
 */
export default function Step3ScheduleInfo({ value, onChange }: Step3ScheduleInfoProps) {
  const { t } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.schedule.heading')}</h2>
        <p>{t('editor.schedule.desc')}</p>
      </div>
      <div className={styles.fieldGrid}>
        <DateTimeLocalField
          label={t('editor.field.eventDateTime')}
          value={value.eventDateTime}
          onChange={(next) => onChange({ eventDateTime: next })}
          required
          inputTestId="schedule-datetime-input"
          buttonTestId="schedule-datetime-picker-button"
        />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.field.venue')}</span>
          <input
            type="text"
            value={value.venueName}
            onChange={(event) => onChange({ venueName: event.target.value })}
            placeholder={t('editor.placeholder.venue')}
            data-testid="schedule-venue-input"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('editor.field.hallDetail')}</span>
          <input
            type="text"
            value={value.venueDetail ?? ''}
            onChange={(event) => onChange({ venueDetail: event.target.value })}
            placeholder={t('editor.placeholder.hall')}
            data-testid="schedule-venue-detail-input"
          />
        </label>
      </div>
    </section>
  );
}
