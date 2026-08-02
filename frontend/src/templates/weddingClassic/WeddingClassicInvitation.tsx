'use client';

/**
 * ❗ CHANGE BOUNDARY
 * - SIMPLE MVP 수정 금지
 * - Runtime Contract 없는 변경 = BUG
 * - RSVP: InvitationRsvpSection (Preview/Public 공통). CTA 문구는 getInvitationRsvpSettings.
 * @see docs/INVITATION_RUNTIME_CONTRACT.md
 * @see docs/CHANGE_GOVERNANCE.md
 */

import styles from './WeddingClassicInvitation.module.css';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import InvitationGallerySection from '@/src/templates/shared/InvitationGallerySection';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';
import InvitationScheduleCalendar from '@/src/templates/shared/InvitationScheduleCalendar';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import InvitationCommentsSection from '@/src/features/comments/ui/InvitationCommentsSection';
import { getConceptPresentationConfig } from '@/src/invitation/conceptPresentationConfig';
import { resolveCommentsEnabled } from '@/src/invitation/commentsSettings';
import { getInvitationGallerySettings } from '@/src/invitation/galleryDisplay';
import { shouldShowAccountsSection } from '@/src/invitation/accountItems';
import { getInvitationScheduleCalendarModel } from '@/src/invitation/scheduleCalendar';
import { useEffect, useState } from 'react';

type WeddingClassicInvitationProps = {
  data: WeddingInvitationData;
  invitationSlug?: string;
  showPlayButton?: boolean;
  previewMode?: boolean;
  onPlayMusic?: () => void;
  /** @deprecated visibility 는 data.rsvpEnabled / getInvitationRsvpSettings 가 SSOT */
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
  void _showRsvpUnused;
  void _onShareUnused;
  void _onKakaoShareUnused;
  void _isSharedUnused;
  void _showCoupleSectionUnused;

  const [heroFailed, setHeroFailed] = useState(false);
  const [heroPortrait, setHeroPortrait] = useState(false);
  const [guestbookExpanded, setGuestbookExpanded] = useState(false);

  const heroImageSrc =
    data && typeof data.heroImage === 'string' && data.heroImage.trim() ? data.heroImage.trim() : '';

  useEffect(() => {
    setHeroFailed(false);
    setHeroPortrait(false);
  }, [heroImageSrc]);

  if (!data) return null;

  const r = data;
  const conceptType = r.conceptType;
  if (conceptType !== 'WEDDING' && conceptType !== 'FUNERAL' && conceptType !== 'GENERAL') {
    return null;
  }
  const heroImage = typeof r.heroImage === 'string' && r.heroImage.trim() ? r.heroImage.trim() : '';
  const gallerySettings = getInvitationGallerySettings(r, {
    alt: t(I18N_KEYS.weddingClassic.galleryImageAlt),
  });
  const galleryItems = gallerySettings.images;
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
  const conceptPresentation = getConceptPresentationConfig(conceptType);
  const hasGallery = conceptPresentation.gallery && galleryItems.length > 0;
  const showGalleryEmptyPlaceholder =
    Boolean(previewMode) && conceptPresentation.gallery && galleryItems.length === 0;
  const hasMessage = Boolean(contentText.trim());
  const showGreetingBlock = hasMessage || Boolean(previewMode);
  const showScheduleBlock = hasSchedule || Boolean(previewMode && conceptPresentation.schedule);
  const showLocationBlock = hasLocation || Boolean(previewMode);
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
  const scheduleCalendar = getInvitationScheduleCalendarModel({
    weddingDate: r.weddingDate instanceof Date || typeof r.weddingDate === 'string' ? r.weddingDate : null,
    eventDate: r.eventDate,
    weddingDateTime: r.weddingDateTime,
  });

  const messageTitle =
    conceptType === 'WEDDING'
      ? t(I18N_KEYS.weddingClassic.messageSectionWedding)
      : conceptType === 'FUNERAL'
        ? t(I18N_KEYS.weddingClassic.messageSectionFuneral)
        : t(I18N_KEYS.weddingClassic.messageSectionGeneral);
  const scheduleTitle = conceptType === 'GENERAL' ? '행사 일정' : '일정';
  const locationTitle = '위치 안내';

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
  const groomParents = (r.groom?.parentsText ?? '').trim();
  const brideParents = (r.bride?.parentsText ?? '').trim();
  const parentsInfo = (r.parentsInfo ?? '').trim();
  const [parentsGroomFallback, parentsBrideFallback] = parentsInfo
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
  /** 커플 섹션: 이름·사진 등 표시 데이터가 하나라도 있으면 true (평탄/중첩 모두 반영) */
  const hasCouple = Boolean(groomDisplay || brideDisplay || groomImg || brideImg);
  // GENERAL 등은 couple 정책상 강제 비표시 (legacy wedding 필드 잔존 무시)
  const showCoupleBlock =
    conceptPresentation.couple &&
    (Boolean(hasCouple || groomPhone || bridePhone || parentsInfo) || Boolean(previewMode));
  const showAccountsBlock = shouldShowAccountsSection(r, conceptType);
  /** WEDDING/GENERAL: 유효 날짜가 있으면 공용 달력형. FUNERAL은 리스트 유지. */
  const useCalendarSchedule =
    Boolean(scheduleCalendar) &&
    (conceptType === 'WEDDING' || conceptType === 'GENERAL') &&
    !mapToneFuneralLike;
  const guestbookMessages = safeArray(r.messages).filter(
    (msg) => typeof msg?.name === 'string' && typeof msg?.content === 'string' && msg.content.trim()
  );
  const showGuestbookSection = Boolean(showGuestbook && guestbookMessages.length > 0);
  const commentsEnabled =
    showGuestbook !== undefined ? Boolean(showGuestbook) : resolveCommentsEnabled(r);
  const showLiveComments = Boolean(commentsEnabled && conceptPresentation.comments);
  const visibleGuestbookMessages = guestbookExpanded
    ? guestbookMessages
    : guestbookMessages.slice(0, 3);

  return (
    <div
      className={`${styles.page} ${pageConceptClass}`}
      data-testid="public-invitation-document"
      data-concept={conceptType}
    >
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
        data-testid="public-hero"
        data-section-id="hero"
        data-preview-section="hero"
      >
        {heroImage && !heroFailed ? (
          <div className={styles.heroMedia}>
            <ImageWithFallback
              className={`${styles.heroImage}${heroPortrait ? ` ${styles.heroImagePortrait}` : ''}`}
              src={heroImage}
              alt=""
              loading="lazy"
              onFailed={() => setHeroFailed(true)}
              onLoad={(event) => {
                const img = event.currentTarget;
                setHeroPortrait(img.naturalHeight > img.naturalWidth);
              }}
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

      {showGreetingBlock ? (
        <section
          className={`${styles.section} ${styles.messageSection}`}
          data-section-id="greeting"
          data-preview-section="greeting"
        >
          <h2 className={styles.calendarTitle}>{messageTitle}</h2>
          <div className={styles.messageBody}>
            {hasMessage ? (
              messageLines.map((line, index) => (
                <p key={`message-line-${index}`} className={`${styles.messageParagraph} ${styles.textBody}`}>
                  {line}
                </p>
              ))
            ) : (
              <p className={`${styles.messageParagraph} ${styles.textBody}`} style={{ opacity: 0.55 }}>
                인사말을 입력해 주세요
              </p>
            )}
          </div>
        </section>
      ) : null}

      {hasMessage ? <hr className={styles.sectionBreak} aria-hidden /> : null}

      {showCoupleBlock ? (
        <section
          className={styles.coupleSection}
          data-testid="couple-section"
          data-section-id="couple"
          data-preview-section="couple"
        >
          {hasCouple ? <p className={styles.scriptLabel}>The Couple</p> : null}
          {hasCouple ? (
            <div className={styles.coupleGrid}>
              {groomDisplay || groomImg || groomPhone ? (
                <div className={styles.couplePerson}>
                  <div className={styles.couplePhotoFrame} data-testid="couple-photo">
                    <ImageWithFallback
                      className={styles.couplePhoto}
                      src={groomImg || null}
                      alt=""
                      loading="lazy"
                      fallback={
                        <div className={styles.coupleAvatarFallback} aria-hidden>
                          {(groomDisplay || '신랑').slice(0, 1)}
                        </div>
                      }
                    />
                  </div>
                  <p className={styles.coupleRole}>{t(I18N_KEYS.weddingClassic.groomLabel)}</p>
                  {groomDisplay ? <p className={styles.coupleName}>{groomDisplay}</p> : null}
                  {(groomParents || parentsGroomFallback) ? (
                    <p className={styles.coupleDetail}>{groomParents || parentsGroomFallback}</p>
                  ) : null}
                  {groomPhone ? (
                    <a className={styles.coupleContactLink} href={`tel:${groomPhone.replace(/\s+/g, '')}`}>
                      연락하기
                    </a>
                  ) : null}
                </div>
              ) : null}
              {brideDisplay || brideImg || bridePhone ? (
                <div className={styles.couplePerson}>
                  <div className={styles.couplePhotoFrame} data-testid="couple-photo">
                    <ImageWithFallback
                      className={styles.couplePhoto}
                      src={brideImg || null}
                      alt=""
                      loading="lazy"
                      fallback={
                        <div className={styles.coupleAvatarFallback} aria-hidden>
                          {(brideDisplay || '신부').slice(0, 1)}
                        </div>
                      }
                    />
                  </div>
                  <p className={styles.coupleRole}>{t(I18N_KEYS.weddingClassic.brideLabel)}</p>
                  {brideDisplay ? <p className={styles.coupleName}>{brideDisplay}</p> : null}
                  {(brideParents || parentsBrideFallback) ? (
                    <p className={styles.coupleDetail}>{brideParents || parentsBrideFallback}</p>
                  ) : null}
                  {bridePhone ? (
                    <a className={styles.coupleContactLink} href={`tel:${bridePhone.replace(/\s+/g, '')}`}>
                      연락하기
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {(r.deceasedName ?? '').trim() ? (
        <section
          className={`${styles.section} ${styles.funeralBlock}`}
          data-section-id="deceased"
          data-preview-section="deceased"
        >
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

      {showScheduleBlock && useCalendarSchedule && scheduleCalendar ? (
        <InvitationScheduleCalendar
          model={scheduleCalendar}
          title={scheduleTitle}
          datetimeLabel={heroDate || undefined}
          venueLabel={locationText || undefined}
          detailLabel={venueDetail || undefined}
          weekdayLabels={weekdays}
          tone={conceptType === 'GENERAL' ? 'general' : 'wedding'}
          className={styles.scheduleSection}
        />
      ) : null}
      {showScheduleBlock && !useCalendarSchedule ? (
        <section
          className={`${styles.section} ${styles.scheduleSection}`}
          data-section-id="schedule"
          data-preview-section="schedule"
        >
          <div className={styles.calendarTitle}>{scheduleTitle}</div>
          {hasSchedule ? (
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
          ) : previewMode ? (
            <p className={styles.scheduleItemDetail} style={{ opacity: 0.55, textAlign: 'center' }}>
              일정을 입력해 주세요
            </p>
          ) : null}
        </section>
      ) : null}

      {hasGallery ? (
        <InvitationGallerySection
          items={galleryItems}
          displayMode={gallerySettings.displayMode}
          sectionLabel="Album"
          tone={conceptType === 'FUNERAL' ? 'funeral' : conceptType === 'GENERAL' ? 'general' : 'wedding'}
          hintText="밀어서 더 많은 이미지 보기"
          lockBodyScroll={!previewMode}
        />
      ) : showGalleryEmptyPlaceholder ? (
        <section
          aria-label="Gallery"
          data-testid="gallery-empty-placeholder"
          data-section-id="gallery"
          data-preview-section="gallery"
          style={{ padding: '48px 24px', textAlign: 'center', opacity: 0.7 }}
        >
          <p style={{ margin: 0, fontSize: 13, letterSpacing: '0.04em' }}>
            갤러리 이미지를 추가해 주세요
          </p>
        </section>
      ) : null}

      {showLocationBlock ? (
        <section
          className={styles.locationSection}
          data-testid="public-location"
          data-section-id="location"
          data-preview-section="location"
        >
          <LocationMapSection
            sectionTitle={locationTitle}
            title={locationText || ''}
            address={addressForMap}
            detailAddress={(r.detailAddress || venueDetail || '').trim() || undefined}
            googlePlaceId={r.googlePlaceId}
            mapLat={r.mapLat}
            mapLng={r.mapLng}
            mapProvider={r.mapProvider}
            naverPlaceId={r.naverPlaceId}
            naverMapUrl={r.naverMapUrl}
            invitationData={data}
            mapImage={r.mapImage}
            mapImageAlt={t(I18N_KEYS.weddingClassic.mapAlt)}
            tone={mapToneFuneralLike ? 'dark' : 'light'}
            previewMode={Boolean(previewMode)}
            transportTitle={t(I18N_KEYS.weddingClassic.transportTitle)}
            transportInfo={safeArray(r.transportInfo)}
            parkingTitle={t(I18N_KEYS.weddingClassic.parkingTitle)}
            parkingInfo={safeArray(r.parkingInfo)}
          />
        </section>
      ) : null}

      {showAccountsBlock ? (
        <InvitationAccountsSection
          accounts={accounts}
          conceptType={conceptType}
          accountsTitle={r.accountsTitle}
          className={styles.accountsSection}
        />
      ) : null}
      {!showAccountsBlock && previewMode && conceptPresentation.account ? (
        <section
          className={styles.accountsSection}
          data-section-id="accounts"
          data-preview-section="accounts"
          data-testid="invitation-accounts-placeholder"
          style={{ padding: '32px 24px', textAlign: 'center', opacity: 0.65 }}
        >
          <p style={{ margin: 0, fontSize: 13 }}>계좌 정보를 추가해 주세요</p>
        </section>
      ) : null}

      <InvitationRsvpSection
        data={data}
        conceptType={conceptType}
        invitationSlug={invitationSlug}
        previewMode={Boolean(previewMode) || !invitationSlug}
      />

      {showLiveComments ? (
        <InvitationCommentsSection
          invitationSlug={invitationSlug}
          conceptType={conceptType}
          enabled
          titleOverride={(r.messagesTitle || '').trim() || undefined}
          previewMode={Boolean(previewMode) || !invitationSlug}
        />
      ) : null}

      {/* legacy static sample guestbook — only when live comments off and samples exist */}
      {!showLiveComments && showGuestbookSection ? (
        <section className={styles.guestbookSection} data-testid="guestbook-section" aria-label="Guestbook">
          <p className={styles.scriptLabel}>Guestbook</p>
          <div className={styles.guestbookList}>
            {visibleGuestbookMessages.map((msg, index) => (
              <article
                key={`${msg.name}-${msg.createdAt}-${index}`}
                className={styles.guestbookCard}
              >
                <div className={styles.guestbookCardHeader}>
                  <div className={styles.guestbookAuthorRow}>
                    <div className={styles.guestbookAvatar} aria-hidden>
                      {(msg.name || '?').slice(0, 1)}
                    </div>
                    <span className={styles.guestbookAuthor}>{msg.name}</span>
                  </div>
                  {msg.createdAt ? (
                    <span className={styles.guestbookTime}>
                      {msg.createdAt.includes(' ') ? msg.createdAt.split(' ')[0] : msg.createdAt}
                    </span>
                  ) : null}
                </div>
                <p className={styles.guestbookBody}>{msg.content}</p>
              </article>
            ))}
          </div>
          <div className={styles.guestbookActions}>
            <button
              type="button"
              className={styles.guestbookBtnSecondary}
              onClick={() => setGuestbookExpanded((prev) => !prev)}
            >
              {guestbookExpanded ? '접기' : '전체보기'}
            </button>
          </div>
        </section>
      ) : null}

      <section
        data-section-id="music"
        data-preview-section="music"
        aria-hidden
        style={{ height: 1, margin: 0, padding: 0, border: 0, overflow: 'hidden' }}
      />

      <section
        data-section-id="share"
        data-preview-section="share"
        aria-hidden
        style={{ height: 1, margin: 0, padding: 0, border: 0, overflow: 'hidden' }}
      />
    </div>
  );
}
