'use client';

import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorInvitationMessage, WeddingEditorSetup } from '../state/weddingEditor.types';

type Step3InvitationMessageProps = {
  value: WeddingEditorInvitationMessage;
  conceptType: WeddingEditorSetup['conceptType'];
  onChange: (value: Partial<WeddingEditorInvitationMessage>) => void;
};

export default function Step3InvitationMessage({ value, conceptType, onChange }: Step3InvitationMessageProps) {
  const { t } = useInvitationT();
  const isEventLike = conceptType === 'GENERAL' || conceptType === 'ORGANIZATION';
  const labels = isEventLike
    ? {
        title: t('editor.message.headingEvent'),
        description: t('editor.message.descEvent'),
        quote: t('editor.message.quoteEvent'),
        body: t('editor.message.bodyEvent'),
        placeholder:
          conceptType === 'ORGANIZATION'
            ? t('editor.default.organizationMessage')
            : t('editor.default.generalMessage'),
      }
    : {
        title: t('editor.message.heading'),
        description: t('editor.message.desc'),
        quote: t('editor.message.quote'),
        body: t('editor.message.body'),
        placeholder: t('editor.default.weddingMessage'),
      };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{labels.title}</h2>
        <p>{labels.description}</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{labels.quote}</span>
        <input
          type="text"
          value={value.quote ?? ''}
          onChange={(event) => onChange({ quote: event.target.value })}
          placeholder={t('editor.message.quotePlaceholder')}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{labels.body}</span>
        <textarea
          rows={6}
          value={value.body}
          onChange={(event) => onChange({ body: event.target.value })}
          placeholder={labels.placeholder}
        />
      </label>
      <div className={styles.noticeBox}>{t('editor.message.notice')}</div>
    </section>
  );
}
