'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './WeddingClassicInvitation.module.css';
import type { WeddingClassicData } from './data';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';

const RSVP_STORAGE_PREFIX = 'invitation_rsvp_';

type RsvpStored = { submitted: true; attending: boolean; name?: string };

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

  const weekdays = [
    t(I18N_KEYS.weddingClassic.weekdaySun),
    t(I18N_KEYS.weddingClassic.weekdayMon),
    t(I18N_KEYS.weddingClassic.weekdayTue),
    t(I18N_KEYS.weddingClassic.weekdayWed),
    t(I18N_KEYS.weddingClassic.weekdayThu),
    t(I18N_KEYS.weddingClassic.weekdayFri),
    t(I18N_KEYS.weddingClassic.weekdaySat),
  ];
  const calendarCells = buildCalendarCells(data.weddingDate);
  const highlightDay = data.weddingDate.getDate();

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

      {/* 1. Invitation Hero – 날짜 중복 제거, 타이틀·오버레이만 */}
      <section className={styles.hero}>
        <img className={styles.heroImage} src={data.heroImage} alt={t(I18N_KEYS.weddingClassic.heroImageAlt)} />
        <div className={styles.heroOverlay}>
          <div className={styles.heroTitle}>{data.heroTitle}</div>
          {data.heroOverlayText && <div className={styles.heroOverlayText}>{data.heroOverlayText}</div>}
        </div>
      </section>

      {/* 2. 핵심 일정 요약 (Single Source: Date / Time / Venue) */}
      <section className={`${styles.section} ${styles.scheduleHighlight}`}>
        <h2 className={styles.calendarTitle}>{t(I18N_KEYS.weddingClassic.scheduleSummaryTitle)}</h2>
        <div className={styles.scheduleDateTime}>{data.weddingDateTime}</div>
        <div className={styles.scheduleVenue}>{data.venueName}</div>
      </section>

      <hr className={styles.sectionBreak} aria-hidden />

      {/* 3. Location 요약 */}
      <section className={styles.section}>
        <LocationMapSection
          title={data.venueName}
          address={data.address}
          mapImage={data.mapImage}
          mapImageAlt={t(I18N_KEYS.weddingClassic.mapAlt)}
          navLabels={{
            tmap: t(I18N_KEYS.weddingClassic.navTmap),
            kakao: t(I18N_KEYS.weddingClassic.navKakao),
            naver: t(I18N_KEYS.weddingClassic.navNaver),
          }}
          transportTitle={t(I18N_KEYS.weddingClassic.transportTitle)}
          transportInfo={data.transportInfo}
          parkingTitle={t(I18N_KEYS.weddingClassic.parkingTitle)}
          parkingInfo={data.parkingInfo}
        />
      </section>

      {/* 4. Program / Schedule (캘린더) */}
      <section className={styles.section}>
        <div className={styles.calendarTitle}>{data.calendarTitle}</div>
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

      <hr className={styles.sectionBreak} aria-hidden />

      {/* 5. Gallery (optional) */}
      <section className={styles.section}>
        <h2>{t(I18N_KEYS.weddingClassic.galleryTitle)}</h2>
        <div className={styles.galleryGrid}>
          {data.galleryImages.map((image) => (
            <img key={image} className={styles.galleryImage} src={image} alt={t(I18N_KEYS.weddingClassic.galleryImageAlt)} />
          ))}
        </div>
      </section>

      {/* 6. Special Notes (인사말·부가 안내) */}
      <section className={styles.section}>
        <h2>{t(I18N_KEYS.weddingClassic.specialNotesTitle)}</h2>
        {data.introQuote && <p className={styles.introQuote}>{data.introQuote}</p>}
        {data.introText.length > 0 &&
          data.introText.map((text, index) => (
            <p key={`${text}-${index}`} className={styles.introText}>
              {text}
            </p>
          ))}
      </section>

      <hr className={styles.sectionBreak} aria-hidden />

      {/* 7. RSVP – 상태에 따라 폼 / Thank You / 읽기 전용 */}
      {showRsvp && (
        <section className={styles.section}>
          <h2>{data.rsvpTitle}</h2>
          <p>{data.rsvpDescription}</p>

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
                {data.rsvpButton}
              </button>
            </>
          )}
        </section>
      )}

      {/* 연락처·Details (하단 고정) */}
      <section className={styles.section}>
        <h1 className={styles.headerTitle}>{data.coupleNames}</h1>
        <div className={styles.coupleGrid}>
          <div className={styles.coupleCard}>
            <img className={styles.coupleImage} src={data.groom.image} alt={data.groom.name} />
            <div className={styles.coupleName}>{data.groom.name}</div>
            <div className={styles.contactLine}>📞 {data.groom.phone}</div>
            <div className={styles.coupleParents}>{data.groom.parentsText}</div>
          </div>
          <div className={styles.coupleCard}>
            <img className={styles.coupleImage} src={data.bride.image} alt={data.bride.name} />
            <div className={styles.coupleName}>{data.bride.name}</div>
            <div className={styles.contactLine}>📞 {data.bride.phone}</div>
            <div className={styles.coupleParents}>{data.bride.parentsText}</div>
          </div>
        </div>
        <button type="button" className={styles.contactButton}>
          {t(I18N_KEYS.weddingClassic.contactButton)}
        </button>
      </section>

      <section className={styles.section}>
        <h2>{data.accountsTitle}</h2>
        <div className={styles.accountList}>
          {data.accounts.map((account) => (
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

      {showGuestbook && (
        <section className={styles.section}>
          <h2>{data.messagesTitle}</h2>
          <div className={styles.messageList}>
            {data.messages.map((message) => (
              <div key={`${message.name}-${message.createdAt}`} className={styles.messageCard}>
                <div className={styles.messageMeta}>
                  {message.name} · {message.createdAt}
                </div>
                <div>{message.content}</div>
              </div>
            ))}
          </div>
        </section>
      )}

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
