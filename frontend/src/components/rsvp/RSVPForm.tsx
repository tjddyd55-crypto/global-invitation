'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import { buildApiUrl } from '@/src/lib/apiBase';
import styles from './RSVPForm.module.css';

type RSVPFormProps = {
  invitationSlug: string;
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

const DEFAULT_FORM = {
  guestName: '',
  attendance: 'yes' as AttendanceValue,
  guestCount: 1,
  mealChoice: '',
  message: '',
};

export default function RSVPForm({ invitationSlug }: RSVPFormProps) {
  const [guestName, setGuestName] = useState(DEFAULT_FORM.guestName);
  const [attendance, setAttendance] = useState<AttendanceValue>(DEFAULT_FORM.attendance);
  const [guestCount, setGuestCount] = useState(DEFAULT_FORM.guestCount);
  const [mealChoice, setMealChoice] = useState(DEFAULT_FORM.mealChoice);
  const [message, setMessage] = useState(DEFAULT_FORM.message);
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [submittedGuestName, setSubmittedGuestName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const normalizedGuestName = guestName.trim();
    const normalizedMealChoice = mealChoice.trim();
    const normalizedMessage = message.trim();

    if (!normalizedGuestName) {
      setError('이름을 입력해 주세요.');
      return;
    }

    if (guestCount < 1 || guestCount > 10) {
      setError('동반 인원은 1명 이상 10명 이하로 입력해 주세요.');
      return;
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
          guestCount,
          mealChoice: normalizedMealChoice || null,
          message: normalizedMessage || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (payload?.error === 'RSVP_DISABLED') {
          throw new Error('이 초대장은 RSVP 접수가 비활성화되어 있습니다.');
        }
        if (payload?.error === 'RSVP_CLOSED') {
          throw new Error('RSVP 접수 기간이 종료되었습니다.');
        }
        if (payload?.error === 'TOO_MANY_RSVP_REQUESTS') {
          throw new Error('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
        if (payload?.error === 'INVITATION_NOT_FOUND') {
          throw new Error('초대장을 찾을 수 없습니다.');
        }
        if (payload?.error === 'GUEST_NAME_MISMATCH') {
          throw new Error('기존 응답을 수정하려면 동일한 이름을 사용해 주세요.');
        }
        throw new Error('RSVP 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }

      const payload = (await response.json()) as RsvpSubmissionResponse;
      setRsvpId(payload.rsvp.id);
      setSubmittedGuestName(payload.rsvp.guestName);
      setSuccess(
        payload.mode === 'updated'
          ? '기존 RSVP 응답이 업데이트되었습니다.'
          : '참석 응답이 접수되었습니다. 감사합니다.'
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'RSVP 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>참석 여부 전달</h2>
      <p className={styles.description}>
        초대해 주셔서 감사합니다. 참석 가능 여부와 간단한 메모를 남겨 주세요.
      </p>
      {submittedGuestName && (
        <div className={styles.helperText}>
          이미 RSVP를 제출하셨습니다. 같은 이름으로 다시 제출하면 기존 응답이 업데이트됩니다.
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="rsvp-guest-name">이름</label>
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
            <label htmlFor="rsvp-attendance">참석 여부</label>
            <select
              id="rsvp-attendance"
              value={attendance}
              onChange={(event) => setAttendance(event.target.value as AttendanceValue)}
              disabled={submitting}
            >
              <option value="yes">참석</option>
              <option value="no">불참</option>
              <option value="maybe">미정</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="rsvp-guest-count">인원 수</label>
            <input
              id="rsvp-guest-count"
              type="number"
              min={1}
              max={10}
              value={guestCount}
              onChange={(event) => setGuestCount(Number(event.target.value) || 1)}
              disabled={submitting}
            />
            <div className={styles.helperText}>최대 10명까지 입력할 수 있습니다.</div>
          </div>
          <div className={styles.field}>
            <label htmlFor="rsvp-meal-choice">식사 옵션 (선택)</label>
            <input
              id="rsvp-meal-choice"
              type="text"
              value={mealChoice}
              onChange={(event) => setMealChoice(event.target.value)}
              maxLength={80}
              disabled={submitting}
              placeholder="예: 채식 / 어린이 식사"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="rsvp-message">메시지 (선택)</label>
          <textarea
            id="rsvp-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={1000}
            disabled={submitting}
            placeholder="전하고 싶은 축하 메시지를 남겨 주세요."
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton} disabled={submitting}>
            {submitting ? '제출 중...' : submittedGuestName ? '응답 업데이트' : '응답 제출'}
          </button>
        </div>
      </form>
    </section>
  );
}
