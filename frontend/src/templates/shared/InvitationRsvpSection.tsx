'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import RSVPForm from '@/src/components/rsvp/RSVPForm';
import {
  getInvitationRsvpSettings,
  type InvitationRsvpSettings,
} from '@/src/invitation/rsvpSettings';
import styles from './InvitationRsvpSection.module.css';

type InvitationRsvpSectionProps = {
  data: unknown;
  invitationSlug?: string;
  previewMode?: boolean;
  conceptType?: string | null;
  className?: string;
};

/**
 * Preview / Public 공통 RSVP 섹션.
 * CTA 문구는 getInvitationRsvpSettings().buttonLabel 을 사용한다.
 */
export default function InvitationRsvpSection({
  data,
  invitationSlug = '',
  previewMode = false,
  conceptType,
  className,
}: InvitationRsvpSectionProps) {
  const settings = getInvitationRsvpSettings(data, conceptType);
  const [formOpen, setFormOpen] = useState(false);

  if (!settings.enabled) {
    return null;
  }

  const canSubmit = Boolean(invitationSlug) && !previewMode;

  return (
    <section
      className={`${styles.section} ${className ?? ''}`.trim()}
      data-section-id="rsvp"
      data-testid="invitation-rsvp-section"
    >
      <h2 className={styles.title}>{settings.sectionTitle}</h2>
      <p className={styles.description}>{settings.description}</p>

      {!formOpen ? (
        <button
          type="button"
          className={styles.cta}
          data-testid="invitation-rsvp-cta"
          onClick={() => setFormOpen(true)}
        >
          {settings.buttonLabel}
        </button>
      ) : null}

      {formOpen ? (
        <div className={styles.formWrap} data-testid="invitation-rsvp-form-wrap">
          {canSubmit ? (
            <RSVPForm invitationSlug={invitationSlug} />
          ) : (
            <PreviewRsvpFormPlaceholder settings={settings} onClose={() => setFormOpen(false)} />
          )}
          {canSubmit ? (
            <button type="button" className={styles.closeForm} onClick={() => setFormOpen(false)}>
              닫기
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PreviewRsvpFormPlaceholder({
  settings,
  onClose,
}: {
  settings: InvitationRsvpSettings;
  onClose: () => void;
}) {
  return (
    <div className={styles.previewBox} data-testid="invitation-rsvp-preview-placeholder">
      <p className={styles.previewHint}>미리보기입니다. 공개 초대장에서는 이 버튼으로 참석 여부를 제출합니다.</p>
      <p className={styles.previewLabel}>버튼 문구</p>
      <div className={styles.previewCta}>{settings.buttonLabel}</div>
      <button type="button" className={styles.closeForm} onClick={onClose}>
        닫기
      </button>
    </div>
  );
}
