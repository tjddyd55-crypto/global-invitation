'use client';

/**
 * ❗ CHANGE BOUNDARY
 * - SIMPLE MVP 수정 금지
 * - Runtime Contract 없는 변경 = BUG
 * - API/Email/Payment 연결 금지
 * - 문서 → 코드 → QA 순서 필수
 * @see docs/INVITATION_RUNTIME_CONTRACT.md
 * @see docs/CHANGE_GOVERNANCE.md
 */

import { useState, useEffect } from 'react';
import styles from './WeddingClassicInvitation.module.css';
import type { WeddingClassicData } from './data';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import DisabledPlaceholder from './DisabledPlaceholder';

/** localStorage 키: invitation_rsvp_${slug}. 서버/API 호출 없음. */
const RSVP_STORAGE_PREFIX = 'invitation_rsvp_';
function getRsvpStorageKey(slug: string): string {
  return `${RSVP_STORAGE_PREFIX}${slug}`;
}

/** RSVP UI 상태 머신. Contract §3 + STEP 2. 문자열 리터럴 직접 비교 금지. */
export const RSVP_UI_STATE = {
  FORM: 'FORM',
  SUBMITTED: 'SUBMITTED',
  READ_ONLY: 'READ_ONLY',
} as const;
export type RsvpUiState = (typeof RSVP_UI_STATE)[keyof typeof RSVP_UI_STATE];

type RsvpStored = { submitted: true; attending: boolean; name?: string };

/** Runtime Contract: 단일 진입점. FULL 템플릿은 이 데이터만 읽고, 누락 시 가드로 섹션 생략. */
type WeddingClassicInvitationProps = {
  data: WeddingClassicData;
  invitationSlug?: string;
  showPlayButton?: boolean;
  onPlayMusic?: () => void;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  onShare?: () => void;
  isShared?: boolean;
};

function safeArray<T>(v: T[] | undefined | null): T[] {
  return Array.isArray(v) ? v : [];
}

function buildCalendarCells(targetDate: Date): (number | null)[] {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  return cells;
}

function getStoredRsvp(slug: string): RsvpStored | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getRsvpStorageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && (parsed as RsvpStored).submitted === true) {
      const p = parsed as RsvpStored;
      return typeof p.attending === 'boolean' ? p : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** localStorage 존재 → READ_ONLY, 없음 → FORM. Contract §3 + STEP 2. */
function getRsvpUiState(stored: RsvpStored | null): RsvpUiState {
  return stored ? RSVP_UI_STATE.READ_ONLY : RSVP_UI_STATE.FORM;
}

function setStoredRsvp(slug: string, value: RsvpStored): void {
  try {
    localStorage.setItem(getRsvpStorageKey(slug), JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function WeddingClassicInvitation({
  data,
  invitationSlug = 'demo-wedding-classic',
  showPlayButton,
  onPlayMusic,
  showRsvp = true,
  showGuestbook = true,
  onShare,
  isShared = false,
}: WeddingClassicInvitationProps) {
  const { t } = useI18n();
  const [rsvpUiState, setRsvpUiState] = useState<RsvpUiState>(RSVP_UI_STATE.FORM);
  const [rsvpAttending, setRsvpAttending] = useState<boolean | null>(null);
  const [rsvpName, setRsvpName] = useState('');
  const [attendingChoice, setAttendingChoice] = useState<'yes' | 'no'>('yes');

  useEffect(() => {
    const stored = getStoredRsvp(invitationSlug);
    setRsvpUiState(getRsvpUiState(stored));
    if (stored) {
      setRsvpAttending(stored.attending);
      setRsvpName(stored.name ?? '');
    } else {
      setRsvpAttending(null);
      setRsvpName('');
    }
  }, [invitationSlug]);

  const handleRsvpSubmit = () => {
    const attending = attendingChoice === 'yes';
    setRsvpUiState(RSVP_UI_STATE.SUBMITTED);
    setRsvpAttending(attending);
    setStoredRsvp(invitationSlug, { submitted: true, attending, name: rsvpName || undefined });
  };

  if (!data) return null;

  const r = data;
  const hasEventSummary = Boolean(r?.weddingDateTime ?? r?.venueName);
  const hasLocation = Boolean(r?.address);
  const hasProgram = Boolean(r?.weddingDate);
  const galleryImages = safeArray(r?.galleryImages);
  const hasGallery = Array.isArray(galleryImages) && galleryImages.length > 0;
  const introText = safeArray(r?.introText);
  const hasSpecialNotes = introText.length > 0 || Boolean(r?.introQuote);
  const rsvpEnabled = showRsvp && r?.rsvp?.enabled === true;
  const accounts = safeArray(r?.accounts);
  const messages = safeArray(r?.messages);
  const weekdays = [
    t(I18N_KEYS.weddingClassic.weekdaySun),
    t(I18N_KEYS.weddingClassic.weekdayMon),
    t(I18N_KEYS.weddingClassic.weekdayTue),
    t(I18N_KEYS.weddingClassic.weekdayWed),
    t(I18N_KEYS.weddingClassic.weekdayThu),
    t(I18N_KEYS.weddingClassic.weekdayFri),
    t(I18N_KEYS.weddingClassic.weekdaySat),
  ];
  const weddingDate = r?.weddingDate ?? new Date(0);
  const calendarCells = buildCalendarCells(weddingDate);
  const highlightDay = weddingDate.getDate();

  return (
    <div className={styles.page}>
      {showPlayButton && onPlayMusic && (
        <button
          className={styles.audioButton}
          onClick={onPlayMusic}
          aria-label={t(I18N_KEYS.weddingClassic.playMusic)}
        >
          🔊
        </button>
      )}

      {/* 1. Hero – Contract: title fallback, 누락 시 빈 문자열 허용 */}
      <section className={styles.hero}>
        <img className={styles.heroImage} src={r.heroImage ?? ''} alt={t(I18N_KEYS.weddingClassic.heroImageAlt)} />
        <div className={styles.heroOverlay}>
          <div className={styles.heroTitle}>{r.heroTitle ?? ''}</div>
          {r.heroOverlayText ? <div className={styles.heroOverlayText}>{r.heroOverlayText}</div> : null}
        </div>
      </section>

      {/* 2. eventSummary – 없으면 섹션 전체 숨김 */}
      {hasEventSummary ? (
        <section className={`${styles.section} ${styles.scheduleHighlight}`}>
          <h2 className={styles.calendarTitle}>{t(I18N_KEYS.weddingClassic.scheduleSummaryTitle)}</h2>
          <div className={styles.scheduleDateTime}>{r.weddingDateTime ?? ''}</div>
          <div className={styles.scheduleVenue}>{r.venueName ?? ''}</div>
        </section>
      ) : null}

      {hasEventSummary ? <hr className={styles.sectionBreak} aria-hidden /> : null}

      {/* 3. Location – address만 사용. date/time/venue는 eventSummary 단일 소스만 (E-1) */}
      {hasLocation ? (
        <section className={styles.section}>
          <LocationMapSection
            title=""
            address={r.address ?? ''}
            mapImage={r.mapImage}
            mapImageAlt={t(I18N_KEYS.weddingClassic.mapAlt)}
            navLabels={{
              tmap: t(I18N_KEYS.weddingClassic.navTmap),
              kakao: t(I18N_KEYS.weddingClassic.navKakao),
              naver: t(I18N_KEYS.weddingClassic.navNaver),
            }}
            transportTitle={t(I18N_KEYS.weddingClassic.transportTitle)}
            transportInfo={safeArray(r.transportInfo)}
            parkingTitle={t(I18N_KEYS.weddingClassic.parkingTitle)}
            parkingInfo={safeArray(r.parkingInfo)}
          />
        </section>
      ) : null}

      {/* 4. Program – 없으면 섹션 미노출 */}
      {hasProgram ? (
        <section className={styles.section}>
          <div className={styles.calendarTitle}>{r.calendarTitle ?? ''}</div>
          <div className={styles.calendarGrid}>
            {weekdays.map((day) => (
              <div key={day} className={`${styles.calendarCell} ${styles.calendarHeader}`}>
                {day}
              </div>
            ))}
            {calendarCells.map((day, index) => (
              <div
                key={`${day ?? 'empty'}-${index}`}
                className={`${styles.calendarCell} ${day === highlightDay ? styles.calendarHighlight : ''}`}
              >
                {day ?? ''}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasProgram ? <hr className={styles.sectionBreak} aria-hidden /> : null}

      {/* 5. Gallery – hasGallery === false면 섹션 전체 미렌더, placeholder/empty UI 없음 (STEP 1-2) */}
      {hasGallery ? (
        <section className={styles.section}>
          <h2>{t(I18N_KEYS.weddingClassic.galleryTitle)}</h2>
          <div className={styles.galleryGrid}>
            {galleryImages.map((image) => (
              <img key={image} className={styles.galleryImage} src={image} alt={t(I18N_KEYS.weddingClassic.galleryImageAlt)} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 6. Special Notes – undefined/빈 배열이면 섹션 제거 */}
      {hasSpecialNotes ? (
        <section className={styles.section}>
          <h2>{t(I18N_KEYS.weddingClassic.specialNotesTitle)}</h2>
          {r.introQuote ? <p className={styles.introQuote}>{r.introQuote}</p> : null}
          {introText.map((text, index) => (
            <p key={`${text}-${index}`} className={styles.introText}>
              {text}
            </p>
          ))}
        </section>
      ) : null}

      {hasSpecialNotes ? <hr className={styles.sectionBreak} aria-hidden /> : null}

      {/*
       * FUTURE EXTENSION (INACTIVE)
       * - Position reserved
       * - Do not enable without Contract update
       * @see docs/INVITATION_RUNTIME_CONTRACT.md §6
       * @see docs/CHANGE_GOVERNANCE.md
       */}
      <DisabledPlaceholder label="AccommodationInfo" className={styles.extensionPlaceholder} />
      <DisabledPlaceholder label="TransportationDetail" className={styles.extensionPlaceholder} />
      <DisabledPlaceholder label="ContactHelpDesk" className={styles.extensionPlaceholder} />
      <DisabledPlaceholder label="HostMessage" className={styles.extensionPlaceholder} />
      <DisabledPlaceholder label="ThankYouAfterRSVP" className={styles.extensionPlaceholder} />

      {/* 7. RSVP – rsvp.enabled === false면 완전 비활성 */}
      {rsvpEnabled ? (
        <section className={styles.section}>
          <h2>{r.rsvpTitle ?? ''}</h2>
          <p>{r.rsvpDescription ?? ''}</p>

          {(rsvpUiState === RSVP_UI_STATE.SUBMITTED || rsvpUiState === RSVP_UI_STATE.READ_ONLY) ? (
            <>
              <div className={styles.rsvpAlreadyResponded} role="status" aria-live="polite">
                <span aria-hidden>🔒</span>
                {t(I18N_KEYS.weddingClassic.rsvpAlreadyResponded)}
              </div>
              <fieldset className={`${styles.rsvpForm} ${styles.rsvpReadOnly}`} disabled aria-disabled="true">
                <div className={styles.rsvpFormRow}>
                  <label>{t(I18N_KEYS.weddingClassic.rsvpNameLabel)}</label>
                  <input type="text" value={rsvpName || '–'} readOnly disabled />
                </div>
                <div className={styles.rsvpFormRow}>
                  <label>{t(I18N_KEYS.weddingClassic.rsvpAttendanceLabel)}</label>
                  <input
                    type="text"
                    value={
                      rsvpAttending === true
                        ? t(I18N_KEYS.weddingClassic.rsvpOptionAttend)
                        : t(I18N_KEYS.weddingClassic.rsvpOptionDecline)
                    }
                    readOnly
                    disabled
                  />
                </div>
              </fieldset>
              <p className={styles.rsvpReadOnlyNotice}>{t(I18N_KEYS.weddingClassic.rsvpReadOnlyNotice)}</p>
              <div className={styles.rsvpThankYouBlock}>
                {rsvpAttending === true
                  ? t(I18N_KEYS.weddingClassic.rsvpThankYouAttend)
                  : t(I18N_KEYS.weddingClassic.rsvpThankYouDecline)}
              </div>
            </>
          ) : (
            <>
              <div className={styles.rsvpForm}>
                <div className={styles.rsvpFormRow}>
                  <label htmlFor="rsvp-name">{t(I18N_KEYS.weddingClassic.rsvpNameLabel)}</label>
                  <input
                    id="rsvp-name"
                    type="text"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.rsvpFormRow}>
                  <label htmlFor="rsvp-attending">{t(I18N_KEYS.weddingClassic.rsvpAttendanceLabel)}</label>
                  <select
                    id="rsvp-attending"
                    value={attendingChoice}
                    onChange={(e) => setAttendingChoice(e.target.value as 'yes' | 'no')}
                  >
                    <option value="yes">{t(I18N_KEYS.weddingClassic.rsvpOptionAttend)}</option>
                    <option value="no">{t(I18N_KEYS.weddingClassic.rsvpOptionDecline)}</option>
                  </select>
                </div>
              </div>
              <button type="button" className={styles.rsvpButton} onClick={handleRsvpSubmit}>
                {r.rsvpButton ?? ''}
              </button>
            </>
          )}
        </section>
      ) : null}

      {/* 연락처·Details (하단) – 단일 객체 섹션, 필수 필드 없으면 미렌더 (STEP F) */}
      {(r?.coupleNames ?? r?.groom ?? r?.bride) ? (
        <section className={styles.section}>
          <h1 className={styles.headerTitle}>{r?.coupleNames ?? ''}</h1>
          <div className={styles.coupleGrid}>
            {r?.groom ? (
              <div className={styles.coupleCard}>
                <img className={styles.coupleImage} src={r.groom?.image ?? ''} alt={r.groom?.name ?? ''} />
                <div className={styles.coupleName}>{r.groom?.name ?? ''}</div>
                <div className={styles.contactLine}>📞 {r.groom?.phone ?? ''}</div>
                <div className={styles.coupleParents}>{r.groom?.parentsText ?? ''}</div>
              </div>
            ) : null}
            {r?.bride ? (
              <div className={styles.coupleCard}>
                <img className={styles.coupleImage} src={r.bride?.image ?? ''} alt={r.bride?.name ?? ''} />
                <div className={styles.coupleName}>{r.bride?.name ?? ''}</div>
                <div className={styles.contactLine}>📞 {r.bride?.phone ?? ''}</div>
                <div className={styles.coupleParents}>{r.bride?.parentsText ?? ''}</div>
              </div>
            ) : null}
          </div>
          <button type="button" className={styles.contactButton}>
            {t(I18N_KEYS.weddingClassic.contactButton)}
          </button>
        </section>
      ) : null}

      {Array.isArray(accounts) && accounts.length > 0 ? (
        <section className={styles.section}>
          <h2>{r?.accountsTitle ?? ''}</h2>
          <div className={styles.accountList}>
            {accounts.map((account) => (
              <div key={`${account.role}-${account.number}`} className={styles.accountCard}>
                <div className={styles.accountHeader}>
                  <strong>{account.role}</strong>
                  <button className={styles.copyButton} type="button">
                    {t(I18N_KEYS.weddingClassic.copyButton)}
                  </button>
                </div>
                <div>{account.bank} {account.number}</div>
                <div>{account.holder}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {showGuestbook && Array.isArray(messages) && messages.length > 0 ? (
        <section className={styles.section}>
          <h2>{r?.messagesTitle ?? ''}</h2>
          <div className={styles.messageList}>
            {messages.map((message) => (
              <div key={`${message.name}-${message.createdAt}`} className={styles.messageCard}>
                <div className={styles.messageMeta}>
                  {message.name} · {message.createdAt}
                </div>
                <div>{message.content}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {onShare && (
        <section className={styles.section}>
          <button className={styles.shareButton} type="button" onClick={onShare}>
            {isShared ? t(I18N_KEYS.weddingClassic.shared) : t(I18N_KEYS.weddingClassic.share)}
          </button>
        </section>
      )}
    </div>
  );
}
