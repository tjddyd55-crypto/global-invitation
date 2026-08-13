'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import { buildApiUrl } from '@/src/lib/apiBase';
import { invitationT } from '@/src/i18n/invitationT';
import type { ProductLocaleId } from '@/src/i18n/productLocales';
import styles from './RSVPForm.module.css';

type RSVPFormProps = {
  invitationSlug: string;
  locale?: ProductLocaleId;
};

type AttendanceValue = 'yes' | 'no' | 'maybe';

type RsvpSubmissionResponse = {
  success: true;
  mode: 'created' | 'updated';
  rsvp: {
    id: string;
    guestName: string;
    attendance: AttendanceValue;
    guestCount: number;
    mealChoice?: string | null;
    message?: string | null;
    createdAt: string;
  };
};

const MIN_GUEST_COUNT = 1;
const MAX_GUEST_COUNT = 99;

const DEFAULT_FORM = {
  guestName: '',
  attendance: 'yes' as AttendanceValue,
  guestCountInput: '1',
  mealChoice: '',
  message: '',
};

export default function RSVPForm({ invitationSlug, locale = 'ko-KR' }: RSVPFormProps) {
  const t = (key: string, vars?: Record<string, string | number>) => invitationT(locale, key, vars);
  const [guestName, setGuestName] = useState(DEFAULT_FORM.guestName);
  const [attendance, setAttendance] = useState<AttendanceValue>(DEFAULT_FORM.attendance);
  const [guestCountInput, setGuestCountInput] = useState(DEFAULT_FORM.guestCountInput);
  const [mealChoice, setMealChoice] = useState(DEFAULT_FORM.mealChoice);
  const [message, setMessage] = useState(DEFAULT_FORM.message);
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [submittedGuestName, setSubmittedGuestName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showGuestCount = attendance !== 'no';

  const handleGuestCountChange = (raw: string) => {
    if (raw === '' || /^\d+$/.test(raw)) {
      setGuestCountInput(raw);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const normalizedGuestName = guestName.trim();
    const normalizedMealChoice = mealChoice.trim();
    const normalizedMessage = message.trim();

    if (!normalizedGuestName) {
      setError(t('rsvp.error.nameRequired'));
      return;
    }

    let guestCount = MIN_GUEST_COUNT;
    if (showGuestCount) {
      if (guestCountInput.trim() === '') {
        setError(t('rsvp.error.countRequired'));
        return;
      }
      const parsed = Number(guestCountInput);
      if (!Number.isInteger(parsed) || parsed < MIN_GUEST_COUNT || parsed > MAX_GUEST_COUNT) {
        setError(t('rsvp.error.countRange', { min: MIN_GUEST_COUNT, max: MAX_GUEST_COUNT }));
        return;
      }
      guestCount = parsed;
    } else {
      guestCount = 0;
    }

    setSubmitting(true);
    try {
      const shouldPatch = Boolean(rsvpId && submittedGuestName && submittedGuestName === normalizedGuestName);
      const endpoint = shouldPatch ? buildApiUrl(`/api/rsvp/${rsvpId}`) : buildApiUrl('/api/rsvp');
      const response = await fetch(endpoint, {
        method: shouldPatch ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationSlug: shouldPatch ? undefined : invitationSlug,
          guestName: normalizedGuestName,
          attendance,
          guestCount: showGuestCount ? guestCount : 1,
          mealChoice: normalizedMealChoice || null,
          message: normalizedMessage || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (payload?.error === 'RSVP_DISABLED') {
          throw new Error(t('rsvp.error.disabled'));
        }
        if (payload?.error === 'RSVP_CLOSED') {
          throw new Error(t('rsvp.error.closed'));
        }
        if (payload?.error === 'TOO_MANY_RSVP_REQUESTS') {
          throw new Error(t('rsvp.error.rateLimit'));
        }
        if (payload?.error === 'INVITATION_NOT_FOUND') {
          throw new Error(t('rsvp.error.notFound'));
        }
        if (payload?.error === 'GUEST_NAME_MISMATCH') {
          throw new Error(t('rsvp.error.nameMismatch'));
        }
        if (payload?.error === 'INVALID_GUEST_COUNT') {
          throw new Error(t('rsvp.error.countRange', { min: MIN_GUEST_COUNT, max: MAX_GUEST_COUNT }));
        }
        throw new Error(t('rsvp.error.failed'));
      }

      const payload = (await response.json()) as RsvpSubmissionResponse;
      setRsvpId(payload.rsvp.id);
      setSubmittedGuestName(payload.rsvp.guestName);
      setSuccess(
        payload.mode === 'updated' ? t('rsvp.success.updated') : t('rsvp.success.created')
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('rsvp.error.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.section} data-testid="rsvp-form">
      <h2 className={styles.title}>{t('rsvp.form.title')}</h2>
      <p className={styles.description}>{t('rsvp.form.description')}</p>
      {submittedGuestName && (
        <div className={styles.helperText}>{t('rsvp.form.already')}</div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="rsvp-guest-name">{t('rsvp.field.name')}</label>
            <input
              id="rsvp-guest-name"
              type="text"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              maxLength={80}
              disabled={submitting}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="rsvp-attendance">{t('rsvp.field.attendance')}</label>
            <select
              id="rsvp-attendance"
              value={attendance}
              onChange={(event) => setAttendance(event.target.value as AttendanceValue)}
              disabled={submitting}
            >
              <option value="yes">{t('rsvp.option.yes')}</option>
              <option value="no">{t('rsvp.option.no')}</option>
              <option value="maybe">{t('rsvp.option.maybe')}</option>
            </select>
          </div>
          {showGuestCount ? (
            <div className={styles.field}>
              <label htmlFor="rsvp-guest-count">{t('rsvp.field.guestCount')}</label>
              <input
                id="rsvp-guest-count"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={guestCountInput}
                onChange={(event) => handleGuestCountChange(event.target.value)}
                disabled={submitting}
                data-testid="rsvp-guest-count"
                aria-describedby="rsvp-guest-count-help"
              />
              <div id="rsvp-guest-count-help" className={styles.helperText}>
                {t('rsvp.helper.guestCount', { max: MAX_GUEST_COUNT })}
              </div>
            </div>
          ) : null}
          <div className={styles.field}>
            <label htmlFor="rsvp-meal-choice">{t('rsvp.field.meal')}</label>
            <input
              id="rsvp-meal-choice"
              type="text"
              value={mealChoice}
              onChange={(event) => setMealChoice(event.target.value)}
              maxLength={80}
              disabled={submitting}
              placeholder={t('rsvp.placeholder.meal')}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="rsvp-message">{t('rsvp.field.message')}</label>
          <textarea
            id="rsvp-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={1000}
            disabled={submitting}
            placeholder={t('rsvp.placeholder.message')}
          />
        </div>

        {error && (
          <div className={styles.error} data-testid="rsvp-error">
            {error}
          </div>
        )}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton} disabled={submitting} data-testid="rsvp-submit">
            {submitting
              ? t('rsvp.action.submitting')
              : submittedGuestName
                ? t('rsvp.action.update')
                : t('rsvp.action.submit')}
          </button>
        </div>
      </form>
    </section>
  );
}
