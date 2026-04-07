'use client';

/**
 * ❗ CHANGE BOUNDARY
 * - SIMPLE MVP 수정 금지
 * - Runtime Contract 없는 변경 = BUG
 * - RSVP: 서버 API만 사용 (/api/rsvp + RSVPForm). 이 컴포넌트는 RSVP UI를 렌더하지 않음.
 * @see docs/INVITATION_RUNTIME_CONTRACT.md
 * @see docs/CHANGE_GOVERNANCE.md
 */

import styles from './WeddingClassicInvitation.module.css';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { cdnImageSrc } from '@/src/lib/image';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';

/** 빈 히어로 URL 시 broken icon 방지 (레지스트리 기본과 동일 자산) */
const WEDDING_HERO_PREVIEW_FALLBACK = '/images/wedding/classic/hero.jpg';

type WeddingClassicInvitationProps = {
  data: WeddingInvitationData;
  invitationSlug?: string;
  showPlayButton?: boolean;
  previewMode?: boolean;
  onPlayMusic?: () => void;
  /** 하위 호환: 과거 템플릿 내 RSVP용. 더 이상 사용하지 않음 (RSVP는 페이지 단 RSVPForm). */
  showRsvp?: boolean;
  showGuestbook?: boolean;
  onShare?: () => void;
  onKakaoShare?: () => void;
  showCoupleSection?: boolean;
  isShared?: boolean;
};

function safeArray<T>(v: T[] | undefined | null): T[] {
  return Array.isArray(v) ? v : [];
}

function safeDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

export default function WeddingClassicInvitation({
  data,
  invitationSlug = 'demo-wedding-classic',
  showPlayButton,
  previewMode = false,
  onPlayMusic,
  showRsvp: _showRsvpUnused,
  showGuestbook = false,
  onShare: _onShareUnused,
  onKakaoShare: _onKakaoShareUnused,
  showCoupleSection = true,
  isShared: _isSharedUnused = false,
}: WeddingClassicInvitationProps) {
  const { t } = useI18n();
  void invitationSlug;
  void previewMode;
  void _showRsvpUnused;
  void _onShareUnused;
  void _onKakaoShareUnused;
  void _isSharedUnused;
  void showGuestbook;

  if (!data) return null;

  const r = data;
  const conceptType = r.conceptType ?? 'WEDDING';
  const heroImage =
    (typeof r.heroImage === 'string' && r.heroImage.trim() ? r.heroImage : '') || WEDDING_HERO_PREVIEW_FALLBACK;
  const galleryImages = Array.isArray(r.galleryImages) ? r.galleryImages : [];
  const title = r.title || r.heroTitle || '';
  const locationText = r.locationText || r.address || '';
  const contentText = r.content || [r.introQuote, ...(safeArray(r.introText))].filter(Boolean).join('\n');
  const scheduleList = safeArray(r.schedule).length > 0 ? safeArray(r.schedule) : [r.eventDate || r.weddingDateTime || ''];
  const hasLocation = Boolean(locationText) || (typeof r.mapLat === 'number' && typeof r.mapLng === 'number');
  const hasSchedule = scheduleList.filter(Boolean).length > 0;
  const hasGallery = conceptType !== 'FUNERAL' && galleryImages.length > 0;
  const hasMessage = Boolean(contentText.trim());
  const accounts = safeArray(r?.accounts);
  const weekdays = [
    t(I18N_KEYS.weddingClassic.weekdaySun),
    t(I18N_KEYS.weddingClassic.weekdayMon),
    t(I18N_KEYS.weddingClassic.weekdayTue),
    t(I18N_KEYS.weddingClassic.weekdayWed),
    t(I18N_KEYS.weddingClassic.weekdayThu),
    t(I18N_KEYS.weddingClassic.weekdayFri),
    t(I18N_KEYS.weddingClassic.weekdaySat),
  ];
  const weddingDate = r?.weddingDate ?? safeDate(r.eventDate || r.weddingDateTime) ?? new Date(0);
  const calendarCells = buildCalendarCells(weddingDate);
  const highlightDay = weddingDate.getDate();

  const messageTitle =
    conceptType === 'WEDDING'
      ? '소중한 날에 함께해 주세요'
      : conceptType === 'FUNERAL'
        ? '부고'
        : '행사 안내';
  const scheduleTitle = conceptType === 'GENERAL' ? '행사 일정' : '일정';
  const locationTitle = '위치 안내';
  const accountsTitle = '마음 전하실 곳';

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

      <section className={styles.section}>
        <div className={styles.heroWrapper}>
          <img className={styles.heroImage} src={cdnImageSrc(heroImage)} alt="" loading="lazy" />
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroTitle}>{title}</div>
          {r.heroOverlayText ? <div className={styles.heroOverlayText}>{r.heroOverlayText}</div> : null}
        </div>
      </section>

      {hasMessage ? (
        <section className={`${styles.section} ${styles.scheduleHighlight}`}>
          <h2 className={styles.calendarTitle}>{messageTitle}</h2>
          <div className={styles.scheduleDateTime} style={{ whiteSpace: 'pre-line' }}>
            {contentText}
          </div>
        </section>
      ) : null}

      {hasMessage ? <hr className={styles.sectionBreak} aria-hidden /> : null}

      {conceptType === 'WEDDING' && showCoupleSection && (r?.coupleNames ?? r?.groomName ?? r?.brideName ?? r?.groom ?? r?.bride) ? (
        <section className={styles.section}>
          <h2 className={styles.calendarTitle}>신랑 · 신부</h2>
          <div className={styles.coupleGrid}>
            {r?.groom || r.groomName ? (
              <div className={styles.coupleCard}>
                <img
                  className={styles.coupleImage}
                  src={cdnImageSrc(r.groom?.image ?? heroImage)}
                  alt={r.groom?.name ?? r.groomName ?? ''}
                  loading="lazy"
                />
                <div className={styles.coupleName}>{r.groom?.name ?? r.groomName ?? ''}</div>
                <div className={styles.contactLine}>📞 {r.groom?.phone ?? r.groomPhone ?? ''}</div>
                <div className={styles.coupleParents}>{r.groom?.parentsText ?? r.parentsInfo ?? ''}</div>
              </div>
            ) : null}
            {r?.bride || r.brideName ? (
              <div className={styles.coupleCard}>
                <img
                  className={styles.coupleImage}
                  src={cdnImageSrc(r.bride?.image ?? heroImage)}
                  alt={r.bride?.name ?? r.brideName ?? ''}
                  loading="lazy"
                />
                <div className={styles.coupleName}>{r.bride?.name ?? r.brideName ?? ''}</div>
                <div className={styles.contactLine}>📞 {r.bride?.phone ?? r.bridePhone ?? ''}</div>
                <div className={styles.coupleParents}>{r.bride?.parentsText ?? r.parentsInfo ?? ''}</div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {conceptType === 'FUNERAL' && (
        <section className={styles.section}>
          <h2 className={styles.calendarTitle}>고인</h2>
          {r.deceasedName ? <p className={styles.introText}>{r.deceasedName}</p> : null}
        </section>
      )}

      {conceptType === 'FUNERAL' && (
        <section className={styles.section}>
          <h2 className={styles.calendarTitle}>빈소 안내</h2>
          {r.funeralHall ? <p className={styles.introText}>{r.funeralHall}</p> : null}
          <h3 className={styles.calendarTitle} style={{ marginTop: '1rem' }}>발인 일정</h3>
          {r.funeralDate ? <p className={styles.introText}>{r.funeralDate}</p> : null}
          <h3 className={styles.calendarTitle} style={{ marginTop: '1rem' }}>조문 안내</h3>
          {r.contactPerson ? <p className={styles.introText}>{r.contactPerson}</p> : null}
        </section>
      )}

      {hasSchedule ? (
        <section className={styles.section}>
          <div className={styles.calendarTitle}>{scheduleTitle}</div>
          {conceptType === 'WEDDING' ? (
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
          ) : (
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {scheduleList.filter(Boolean).map((item, index) => (
                <div key={`${item}-${index}`} className={styles.scheduleVenue}>
                  {item}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {hasGallery ? (
        <section className={styles.section}>
          <h2>{t(I18N_KEYS.weddingClassic.galleryTitle)}</h2>
          <div className={styles.galleryGrid}>
            {galleryImages.map((image) => (
              <img
                key={image}
                className={styles.galleryImage}
                src={cdnImageSrc(image)}
                alt={t(I18N_KEYS.weddingClassic.galleryImageAlt)}
                loading="lazy"
              />
            ))}
          </div>
        </section>
      ) : null}

      {hasLocation ? (
        <section className={styles.section}>
          <LocationMapSection
            sectionTitle={locationTitle}
            title=""
            address={locationText}
            mapLat={r.mapLat}
            mapLng={r.mapLng}
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

      {conceptType !== 'GENERAL' && Array.isArray(accounts) && accounts.length > 0 ? (
        <section className={styles.section}>
          <h2>{accountsTitle}</h2>
          <div className={styles.accountList}>
            {accounts.map((account) => (
              <div key={`${account.role}-${account.number}`} className={styles.accountCard}>
                <div className={styles.accountHeader}>
                  <strong>{account.role}</strong>
                  <button className={styles.copyButton} type="button">
                    {t(I18N_KEYS.weddingClassic.copyButton)}
                  </button>
                </div>
                <div>
                  {account.bank} {account.number}
                </div>
                <div>{account.holder}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
