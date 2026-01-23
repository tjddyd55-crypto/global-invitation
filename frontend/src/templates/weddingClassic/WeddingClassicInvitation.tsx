'use client';

import styles from './WeddingClassicInvitation.module.css';
import type { WeddingClassicData } from './data';

type WeddingClassicInvitationProps = {
  data: WeddingClassicData;
  showPlayButton?: boolean;
  onPlayMusic?: () => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

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
}: WeddingClassicInvitationProps) {
  const calendarCells = buildCalendarCells(data.weddingDate);
  const highlightDay = data.weddingDate.getDate();

  return (
    <div className={styles.page}>
      {showPlayButton && onPlayMusic && (
        <button className={styles.audioButton} onClick={onPlayMusic} aria-label="Play music">
          🔊
        </button>
      )}

      <section className={styles.hero}>
        <img className={styles.heroImage} src={data.heroImage} alt="Wedding hero" />
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
        <p className={styles.introQuote}>{data.introQuote}</p>
        {data.introText.map((text, index) => (
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
        <button className={styles.contactButton}>혼주에게 연락하기</button>
      </section>

      <section className={styles.section}>
        <div className={styles.calendarTitle}>{data.calendarTitle}</div>
        <div className={styles.calendarGrid}>
          {WEEKDAYS.map((day) => (
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
        <h2>갤러리</h2>
        <div className={styles.galleryGrid}>
          {data.galleryImages.map((image) => (
            <img key={image} className={styles.galleryImage} src={image} alt="Gallery" />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.locationBlock}>
          <h2>{data.venueName}</h2>
          <div>{data.address}</div>
        </div>
        <img className={styles.mapImage} src={data.mapImage} alt="Map" />
        <div className={styles.navButtons}>
          <button className={styles.navButton}>티맵</button>
          <button className={styles.navButton}>카카오내비</button>
          <button className={styles.navButton}>네이버지도</button>
        </div>
        <div className={styles.infoList}>
          <strong>셔틀버스 타는 곳</strong>
          {data.transportInfo.map((line) => (
            <div key={line}>- {line}</div>
          ))}
        </div>
        <div className={styles.infoList}>
          <strong>자가용 이용 시</strong>
          {data.parkingInfo.map((line) => (
            <div key={line}>- {line}</div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>{data.rsvpTitle}</h2>
        <p>{data.rsvpDescription}</p>
        <button className={styles.rsvpButton}>{data.rsvpButton}</button>
      </section>

      <section className={styles.section}>
        <h2>{data.accountsTitle}</h2>
        <div className={styles.accountList}>
          {data.accounts.map((account) => (
            <div key={`${account.role}-${account.number}`} className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <strong>{account.role}</strong>
                <button className={styles.copyButton} type="button">복사</button>
              </div>
              <div>{account.bank} {account.number}</div>
              <div>{account.holder}</div>
            </div>
          ))}
        </div>
      </section>

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
    </div>
  );
}
