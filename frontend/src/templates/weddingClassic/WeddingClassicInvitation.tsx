'use client';

import styles from './WeddingClassicInvitation.module.css';
import type { WeddingClassicData } from './data';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';

type WeddingClassicInvitationProps = {
  data: WeddingClassicData;
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

export default function WeddingClassicInvitation({
  data,
  showPlayButton,
  onPlayMusic,
  showRsvp = true,
  showGuestbook = true,
  onShare,
  isShared = false,
}: WeddingClassicInvitationProps) {
  const { t } = useI18n();
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

  return (
    <div className={styles.page}>
      {showPlayButton && onPlayMusic && (
        <button
          className={styles.audioButton}
          onClick={onPlayMusic}
          aria-label={t(I18N_KEYS.fields.playMusic)}
        >
          🔊
        </button>
      )}

      <section className={styles.hero}>
        <img className={styles.heroImage} src={data.heroImage} alt={t(I18N_KEYS.weddingClassic.heroImageAlt)} />
        <div className={styles.heroOverlay}>
          <div className={styles.heroTitle}>{data.heroTitle}</div>
          <div className={styles.heroSubtitle}>{data.heroSubtitle}</div>
          {data.heroOverlayText && <div className={styles.heroOverlayText}>{data.heroOverlayText}</div>}
        </div>
      </section>

      <section className={styles.section}>
        <h1 className={styles.headerTitle}>{data.coupleNames}</h1>
        <p className={styles.headerMeta}>{data.weddingDateTime}</p>
        <p className={styles.headerMeta}>{data.venueName}</p>
      </section>

      <section className={styles.section}>
        {data.introQuote && <p className={styles.introQuote}>{data.introQuote}</p>}
        {data.introText.length > 0 && data.introText.map((text, index) => (
          <p key={`${text}-${index}`} className={styles.introText}>
            {text}
          </p>
        ))}
      </section>

      <section className={styles.section}>
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
        <button className={styles.contactButton}>{t(I18N_KEYS.weddingClassic.contactButton)}</button>
      </section>

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

      <section className={styles.section}>
        <h2>{t(I18N_KEYS.weddingClassic.galleryTitle)}</h2>
        <div className={styles.galleryGrid}>
          {data.galleryImages.map((image) => (
            <img key={image} className={styles.galleryImage} src={image} alt={t(I18N_KEYS.weddingClassic.galleryImageAlt)} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <LocationMapSection
          title={data.venueName}
          address={data.address}
          mapImage={data.mapImage}
          mapImageAlt={t(I18N_KEYS.common.mapAlt)}
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

      {showRsvp && (
        <section className={styles.section}>
          <h2>{data.rsvpTitle}</h2>
          <p>{data.rsvpDescription}</p>
          <button className={styles.rsvpButton}>{data.rsvpButton}</button>
        </section>
      )}

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
                <div className={styles.messageMeta}>{message.name} · {message.createdAt}</div>
                <div>{message.content}</div>
              </div>
            ))}
          </div>
        </section>
      )}
      {onShare && (
        <section className={styles.section}>
          <button className={styles.shareButton} type="button" onClick={onShare}>
            {isShared ? t(I18N_KEYS.common.shared) : t(I18N_KEYS.common.share)}
          </button>
        </section>
      )}
    </div>
  );
}
