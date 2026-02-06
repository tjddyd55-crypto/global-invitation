'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './WeddingClassicInvitation.module.css';
import type { WeddingClassicData } from './data';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import DisabledPlaceholder from './DisabledPlaceholder';

const RSVP_STORAGE_PREFIX = 'invitation_rsvp_';

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
    const raw = localStorage.getItem(`${RSVP_STORAGE_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RsvpStored;
    return parsed?.submitted === true ? parsed : null;
  } catch {
    return null;
  }
}

function setStoredRsvp(slug: string, value: RsvpStored): void {
  try {
    localStorage.setItem(`${RSVP_STORAGE_PREFIX}${slug}`, JSON.stringify(value));
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
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState<boolean | null>(null);
  const [rsvpName, setRsvpName] = useState('');
  const [attendingChoice, setAttendingChoice] = useState<'yes' | 'no'>('yes');

  const r = data;
  const hasEventSummary = Boolean(r.weddingDateTime ?? r.venueName);
  const hasLocation = Boolean(r.address ?? r.venueName);
  const hasProgram = Boolean(r.weddingDate);
  const galleryImages = safeArray(r.galleryImages);
  const introText = safeArray(r.introText);
  const hasSpecialNotes = introText.length > 0 || Boolean(r.introQuote);
  const rsvpEnabled = showRsvp && (r.rsvp?.enabled !== false);
  const accounts = safeArray(r.accounts);
  const messages = safeArray(r.messages);
  const weekdays = [
    t(I18N_KEYS.weddingClassic.weekdaySun),
    t(I18N_KEYS.weddingClassic.weekdayMon),
    t(I18N_KEYS.weddingClassic.weekdayTue),
    t(I18N_KEYS.weddingClassic.weekdayWed),
    t(I18N_KEYS.weddingClassic.weekdayThu),
    t(I18N_KEYS.weddingClassic.weekdayFri),
    t(I18N_KEYS.weddingClassic.weekdaySat),
  ];
  const weddingDate = r.weddingDate ?? new Date(0);
  const calendarCells = buildCalendarCells(weddingDate);
  const highlightDay = weddingDate.getDate();

  const loadRsvpState = useCallback(() => {
    const stored = getStoredRsvp(invitationSlug);
    if (stored) {
      setRsvpSubmitted(true);
      setRsvpAttending(stored.attending);
      setRsvpName(stored.name ?? '');
    }
  }, [invitationSlug]);

  useEffect(() => {
    loadRsvpState();
  }, [loadRsvpState]);

  const handleRsvpSubmit = () => {
    const attending = attendingChoice === 'yes';
    setRsvpSubmitted(true);
    setRsvpAttending(attending);
    setStoredRsvp(invitationSlug, { submitted: true, attending, name: rsvpName || undefined });
  };

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

      {/* 3. Location – address/venue 없으면 섹션 생략 */}
      {hasLocation ? (
        <section className={styles.section}>
          <LocationMapSection
            title={r.venueName ?? ''}
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

      {/* 5. Gallery – empty면 EmptyState만 노출 */}
      <section className={styles.section}>
        <h2>{t(I18N_KEYS.weddingClassic.galleryTitle)}</h2>
        {galleryImages.length > 0 ? (
          <div className={styles.galleryGrid}>
            {galleryImages.map((image) => (
              <img key={image} className={styles.galleryImage} src={image} alt={t(I18N_KEYS.weddingClassic.galleryImageAlt)} />
            ))}
          </div>
        ) : (
          <div className={styles.galleryEmpty} aria-label="No images">
            {t(I18N_KEYS.weddingClassic.galleryImageAlt)}
          </div>
        )}
      </section>

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

      {/* Future Extension (inactive) – 위치만 예약 */}
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

          {rsvpSubmitted ? (
            <>
              <div className={styles.rsvpAlreadyResponded} role="status">
                <span aria-hidden>🔒</span>
                {t(I18N_KEYS.weddingClassic.rsvpAlreadyResponded)}
              </div>
              <div className={`${styles.rsvpForm} ${styles.rsvpReadOnly}`}>
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
              </div>
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

      {/* 연락처·Details (하단) – groom/bride optional */}
      {(r.coupleNames ?? r.groom ?? r.bride) ? (
        <section className={styles.section}>
          <h1 className={styles.headerTitle}>{r.coupleNames ?? ''}</h1>
          <div className={styles.coupleGrid}>
            {r.groom ? (
              <div className={styles.coupleCard}>
                <img className={styles.coupleImage} src={r.groom.image} alt={r.groom.name} />
                <div className={styles.coupleName}>{r.groom.name}</div>
                <div className={styles.contactLine}>📞 {r.groom.phone}</div>
                <div className={styles.coupleParents}>{r.groom.parentsText}</div>
              </div>
            ) : null}
            {r.bride ? (
              <div className={styles.coupleCard}>
                <img className={styles.coupleImage} src={r.bride.image} alt={r.bride.name} />
                <div className={styles.coupleName}>{r.bride.name}</div>
                <div className={styles.contactLine}>📞 {r.bride.phone}</div>
                <div className={styles.coupleParents}>{r.bride.parentsText}</div>
              </div>
            ) : null}
          </div>
          <button type="button" className={styles.contactButton}>
            {t(I18N_KEYS.weddingClassic.contactButton)}
          </button>
        </section>
      ) : null}

      {accounts.length > 0 ? (
        <section className={styles.section}>
          <h2>{r.accountsTitle ?? ''}</h2>
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

      {showGuestbook && messages.length > 0 ? (
        <section className={styles.section}>
          <h2>{r.messagesTitle ?? ''}</h2>
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
