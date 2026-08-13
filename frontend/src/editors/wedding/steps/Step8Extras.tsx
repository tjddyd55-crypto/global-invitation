'use client';
/* eslint-disable i18next/no-literal-string */

import ToggleRow from '../components/ToggleRow';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorExtras } from '../state/weddingEditor.types';
import {
  RSVP_BUTTON_LABEL_MAX_LENGTH,
  clampRsvpButtonLabel,
} from '@/src/invitation/rsvpSettings';

type Step8ExtrasProps = {
  value: WeddingEditorExtras;
  onChange: (value: Partial<WeddingEditorExtras>) => void;
};

/**
 * 참석 여부 · 댓글 설정 (음악은 Step9MusicSettings).
 */
export default function Step8Extras({ value, onChange }: Step8ExtrasProps) {
  const { t } = useInvitationT();
  const buttonLabelPreview = clampRsvpButtonLabel(
    value.rsvpButtonText ?? '',
    t('rsvp.button.wedding')
  );

  return (
    <section className={styles.stepSection} data-testid="editor-rsvp-step">
      <div className={styles.sectionHeader}>
        <h2>{t('editor.rsvp.heading')}</h2>
        <p>{t('editor.rsvp.desc')}</p>
      </div>
      <div className={styles.toggleGroup}>
        <ToggleRow
          label={t('editor.rsvp.toggle')}
          description={t('editor.rsvp.toggleDesc')}
          checked={value.rsvpEnabled}
          testId="editor-rsvp-toggle"
          onChange={(checked) => onChange({ rsvpEnabled: checked })}
        />
        <ToggleRow
          label={t('editor.rsvp.commentsToggle')}
          description={t('editor.rsvp.commentsToggleDesc')}
          checked={value.guestbookEnabled}
          testId="editor-comments-toggle"
          onChange={(checked) => onChange({ guestbookEnabled: checked })}
        />
      </div>
      {value.rsvpEnabled && (
        <div className={styles.rsvpButtonField} data-testid="editor-rsvp-button-field">
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.rsvp.buttonLabel')}</span>
            <input
              type="text"
              value={value.rsvpButtonText ?? ''}
              maxLength={RSVP_BUTTON_LABEL_MAX_LENGTH}
              data-testid="editor-rsvp-button-label"
              onChange={(event) => onChange({ rsvpButtonText: event.target.value })}
              placeholder={t('editor.rsvp.buttonPlaceholder')}
            />
          </label>
          <p className={styles.helperText}>{t('editor.rsvp.buttonHint')}</p>
          <div className={styles.rsvpButtonPreview} data-testid="editor-rsvp-button-preview">
            <span className={styles.rsvpButtonPreviewLabel}>{t('editor.rsvp.buttonPreview')}</span>
            <div className={styles.rsvpButtonPreviewCta}>{buttonLabelPreview}</div>
          </div>
        </div>
      )}
    </section>
  );
}
