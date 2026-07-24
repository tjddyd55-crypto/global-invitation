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
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import { useEffect, useState } from 'react';

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

function normalizeMessageText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').join('\n');
  }
  return '';
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
  invitationSlug = '',
  showPlayButton,
  previewMode = false,
  onPlayMusic,
  showRsvp: _showRsvpUnused,
  showGuestbook = false,
  onShare: _onShareUnused,
  onKakaoShare: _onKakaoShareUnused,
  showCoupleSection: _showCoupleSectionUnused = true,
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
  void _showCoupleSectionUnused;

  const [failedGallerySrcs, setFailedGallerySrcs] = useState<Record<string, true>>({});
  const [heroFailed, setHeroFailed] = useState(false);

  const heroImageSrc =
    data && typeof data.heroImage === 'string' && data.heroImage.trim() ? data.heroImage.trim() : '';

  useEffect(() => {
    setHeroFailed(false);
  }, [heroImageSrc]);

  if (!data) return null;

  const r = data;
  const conceptType = r.conceptType;
  if (conceptType !== 'WEDDING' && conceptType !== 'FUNERAL' && conceptType !== 'GENERAL') {
    return null;
  }
  const heroImage = typeof r.heroImage === 'string' && r.heroImage.trim() ? r.heroImage.trim() : '';
  const galleryImages = Array.isArray(r.galleryImages) ? r.galleryImages.filter((img) => typeof img === 'string' && img.trim()) : [];
  const visibleGalleryImages = galleryImages.filter((image) => !failedGallerySrcs[image]);
  const title = (r.title || r.heroTitle || '').trim();
  const subtitle = (r.subtitle ?? '').trim();
  const locationText = (r.locationText || r.venueName || '').trim();
  const venueDetail = (r.venueDetail ?? '').trim();
  const addressForMap = (r.address || '').trim() || locationText;
  const contentText = normalizeMessageText(r.content);
  const messageLines = contentText.split('\n');
  const scheduleList = safeArray(r.schedule).length > 0 ? safeArray(r.schedule) : [r.eventDate || r.weddingDateTime || ''];
  const hasLocation =
    Boolean(addressForMap.trim()) || (typeof r.mapLat === 'number' && typeof r.mapLng === 'number');
  const hasSchedule = scheduleList.filter(Boolean).length > 0;
  const showHeroMedia = Boolean(heroImage) && !heroFailed;
  const hasGallery = visibleGalleryImages.length > 0;
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
  const weddingDate =
    r?.weddingDate instanceof Date
      ? r.weddingDate
      : safeDate(typeof r?.weddingDate === 'string' ? r.weddingDate : undefined) ??
        safeDate(r.eventDate || r.weddingDateTime) ??
        new Date(0);
  const calendarCells = buildCalendarCells(weddingDate);
  const highlightDay = weddingDate.getDate();

  const messageTitle =
    conceptType === 'WEDDING'
      ? t(I18N_KEYS.weddingClassic.messageSectionWedding)
      : conceptType === 'FUNERAL'
        ? t(I18N_KEYS.weddingClassic.messageSectionFuneral)
        : t(I18N_KEYS.weddingClassic.messageSectionGeneral);
  const scheduleTitle = conceptType === 'GENERAL' ? '행사 일정' : '일정';
  const locationTitle = '위치 안내';
  const accountsTitle = '마음 전하실 곳';

  const scheduleForHero = scheduleList.filter(Boolean);
  const heroDate =
    (typeof r.weddingDateTime === 'string' && r.weddingDateTime.trim() ? r.weddingDateTime.trim() : '') ||
    scheduleForHero[0] ||
    (typeof r.eventDate === 'string' ? r.eventDate : '') ||
    '';
  const heroLocationLine = locationText;
  const mapToneFuneralLike = Boolean(
    (r.deceasedName ?? '').trim() || (r.funeralHall ?? '').trim() || (r.funeralDate ?? '').trim()
  );
  const pageConceptClass =
    conceptType === 'WEDDING' ? styles.conceptWedding : conceptType === 'FUNERAL' ? styles.conceptFuneral : styles.conceptGeneral;

  const groomDisplay = (r.groomName ?? r.groom?.name ?? '').trim();
  const brideDisplay = (r.brideName ?? r.bride?.name ?? '').trim();
  const groomImg = (r.groomImage ?? r.groom?.image ?? '').trim();
  const brideImg = (r.brideImage ?? r.bride?.image ?? '').trim();
  const groomPhone = (r.groomPhone ?? r.groom?.phone ?? '').trim();
  const bridePhone = (r.bridePhone ?? r.bride?.phone ?? '').trim();
  const parentsInfo = (r.parentsInfo ?? '').trim();
  /** 커플 섹션: 이름·사진 등 표시 데이터가 하나라도 있으면 true (평탄/중첩 모두 반영) */
  const hasCouple = Boolean(groomDisplay || brideDisplay || groomImg || brideImg);
  const showCoupleBlock = Boolean(hasCouple || groomPhone || bridePhone || parentsInfo);
  /** 장례 일정 데이터가 있으면 리스트, 그 외에는 커플 데이터가 있을 때만 웨딩형 캘린더 */
  const useCalendarSchedule = hasCouple && !mapToneFuneralLike;

  return (
    <div className={`${styles.page} ${pageConceptClass}`}>
      {showPlayButton && onPlayMusic && (
        <button
          className={styles.audioButton}
          onClick={onPlayMusic}
          aria-label={t(I18N_KEYS.weddingClassic.playMusic)}
        >
          🔊
        </button>
      )}

      <section
        className={`${styles.heroSection} ${showHeroMedia ? '' : styles.heroSectionNoImage}`}
        aria-label="대표 이미지"
      >
        {heroImage && !heroFailed ? (
          <div className={styles.heroMedia}>
            <ImageWithFallback
              className={styles.heroImage}
              src={heroImage}
              alt=""
              loading="lazy"
              onFailed={() => setHeroFailed(true)}
            />
          </div>
        ) : null}
        {showHeroMedia ? <div className={styles.heroOverlay} aria-hidden /> : null}
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            {title ? <h1 className={styles.heroTitle}>{title}</h1> : null}
            {subtitle ||
            heroDate ||
            (r.heroOverlayText ?? '').trim() ||
            heroLocationLine ||
            venueDetail ? (
              <div className={styles.heroMetaStack}>
                {subtitle ? <p className={styles.heroMeta}>{subtitle}</p> : null}
                {heroDate ? <p className={styles.heroMeta}>{heroDate}</p> : null}
                {(r.heroOverlayText ?? '').trim() ? <p className={styles.heroMeta}>{r.heroOverlayText}</p> : null}
                {heroLocationLine ? <p className={styles.heroMeta}>{heroLocationLine}</p> : null}
                {venueDetail ? <p className={styles.heroMeta}>{venueDetail}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {hasMessage ? (
        <section className={`${styles.section} ${styles.messageSection}`}>
          <h2 className={styles.calendarTitle}>{messageTitle}</h2>
          <div className={styles.messageBody}>
            {messageLines.map((line, index) => (
              <p key={`message-line-${index}`} className={`${styles.messageParagraph} ${styles.textBody}`}>
                {line}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {hasMessage ? <hr className={styles.sectionBreak} aria-hidden /> : null}

      {showCoupleBlock ? (
        <section className={styles.section}>
          {hasCouple ? <h2 className={styles.calendarTitle}>신랑 · 신부</h2> : null}
          {hasCouple ? (
            <div className={styles.coupleSimple}>
              {groomDisplay ? <p className={styles.coupleNamePrimary}>{groomDisplay}</p> : null}
              {groomDisplay && brideDisplay ? <p className={styles.coupleHeart}>♥</p> : null}
              {brideDisplay ? <p className={styles.coupleNamePrimary}>{brideDisplay}</p> : null}
            </div>
          ) : null}
          {hasCouple && (groomImg || brideImg || groomDisplay || brideDisplay) ? (
            <div className={styles.couplePhotosRow}>
              {groomDisplay || groomImg ? (
                <div className={styles.couplePhotoWrap}>
                  <ImageWithFallback
                    className={styles.couplePhoto}
                    src={groomImg || null}
                    alt=""
                    loading="lazy"
                    fallback={<div className={styles.coupleAvatarFallback} aria-hidden>{(groomDisplay || '신랑').slice(0, 1)}</div>}
                  />
                  {groomDisplay ? <div className={styles.couplePhotoCaption}>{groomDisplay}</div> : null}
                </div>
              ) : null}
              {brideDisplay || brideImg ? (
                <div className={styles.couplePhotoWrap}>
                  <ImageWithFallback
                    className={styles.couplePhoto}
                    src={brideImg || null}
                    alt=""
                    loading="lazy"
                    fallback={<div className={styles.coupleAvatarFallback} aria-hidden>{(brideDisplay || '신부').slice(0, 1)}</div>}
                  />
                  {brideDisplay ? <div className={styles.couplePhotoCaption}>{brideDisplay}</div> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {groomPhone || bridePhone ? (
            <div className={styles.couplePhoneBlock}>
              {groomPhone ? (
                <div>
                  {t(I18N_KEYS.weddingClassic.groomLabel)} {groomPhone}
                </div>
              ) : null}
              {bridePhone ? (
                <div>
                  {t(I18N_KEYS.weddingClassic.brideLabel)} {bridePhone}
                </div>
              ) : null}
            </div>
          ) : null}
          {parentsInfo ? <div className={styles.coupleParentsBlock}>{parentsInfo}</div> : null}
        </section>
      ) : null}

      {(r.deceasedName ?? '').trim() ? (
        <section className={`${styles.section} ${styles.funeralBlock}`}>
          <h2 className={styles.calendarTitle}>고인</h2>
          <p className={styles.funeralLine}>{(r.deceasedName ?? '').trim()}</p>
        </section>
      ) : null}

      {(r.funeralHall ?? '').trim() || (r.funeralDate ?? '').trim() || (r.contactPerson ?? '').trim() ? (
        <section className={`${styles.section} ${styles.funeralBlock}`}>
          <h2 className={styles.calendarTitle}>빈소 안내</h2>
          {(r.funeralHall ?? '').trim() ? (
            <p className={styles.funeralLine}>
              <span className={styles.funeralLabel}>빈소</span> {(r.funeralHall ?? '').trim()}
            </p>
          ) : null}
          {(r.funeralDate ?? '').trim() ? (
            <p className={styles.funeralLine}>
              <span className={styles.funeralLabel}>발인</span> {(r.funeralDate ?? '').trim()}
            </p>
          ) : null}
          {(r.contactPerson ?? '').trim() ? (
            <p className={styles.funeralLine}>
              <span className={styles.funeralLabel}>조문</span> {(r.contactPerson ?? '').trim()}
            </p>
          ) : null}
        </section>
      ) : null}

      {hasSchedule ? (
        <section className={`${styles.section} ${styles.scheduleSection}`}>
          <div className={styles.calendarTitle}>{scheduleTitle}</div>
          {useCalendarSchedule ? (
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
            <ul className={styles.scheduleList}>
              {scheduleList.filter(Boolean).map((item, index) => {
                const parts = item.split('\n').map((p) => p.trim()).filter(Boolean);
                const head = parts[0] ?? item;
                const rest = parts.slice(1);
                return (
                  <li key={`${item}-${index}`} className={styles.scheduleItem}>
                    <div className={styles.scheduleItemDate}>{head}</div>
                    {rest.length > 0 ? (
                      <div className={styles.scheduleItemDetail}>{rest.join(' · ')}</div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {hasGallery ? (
        <section className={styles.section}>
          <h2>{t(I18N_KEYS.weddingClassic.galleryTitle)}</h2>
          <div className={styles.galleryGrid}>
            {visibleGalleryImages.map((image) => (
              <ImageWithFallback
                key={image}
                className={styles.galleryImage}
                src={image}
                alt={t(I18N_KEYS.weddingClassic.galleryImageAlt)}
                loading="lazy"
                onFailed={() => {
                  setFailedGallerySrcs((prev) => ({ ...prev, [image]: true }));
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {hasLocation ? (
        <section className={`${styles.section} ${styles.locationSection}`}>
          <LocationMapSection
            sectionTitle={locationTitle}
            title=""
            address={addressForMap}
            mapLat={r.mapLat}
            mapLng={r.mapLng}
            mapImage={r.mapImage}
            mapImageAlt={t(I18N_KEYS.weddingClassic.mapAlt)}
            tone={mapToneFuneralLike ? 'dark' : 'light'}
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

      {Array.isArray(accounts) && accounts.length > 0 ? (
        <section className={`${styles.section} ${styles.accountsSection}`}>
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
