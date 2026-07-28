'use client';
/* eslint-disable i18next/no-literal-string */

import InvitationCommentsSection from '@/src/features/comments/ui/InvitationCommentsSection';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import GalleryCarousel from '@/src/templates/shared/GalleryCarousel';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import { resolveCommentsEnabled } from '@/src/invitation/commentsSettings';
import { getInvitationGalleryItems } from '@/src/invitation/galleryItems';
import { shouldShowAccountsSection } from '@/src/invitation/accountItems';
import { getInvitationSections } from '@/src/invitation/conceptPresentationConfig';
import { getInvitationRsvpSettings } from '@/src/invitation/rsvpSettings';
import styles from './GeneralInvitationRenderer.module.css';

type GeneralInvitationRendererProps = {
  data: WeddingInvitationData;
  invitationSlug?: string;
  previewMode?: boolean;
  showRsvp?: boolean;
  showComments?: boolean;
  onShare?: () => void;
};

function asLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * GENERAL 전용 presentation — Wedding couple/account 축의금 UI 금지.
 * 갤러리는 공통 GalleryCarousel, 계좌는 선택형 참가비 섹션.
 */
export default function GeneralInvitationRenderer({
  data,
  invitationSlug,
  previewMode = false,
  showRsvp,
  showComments,
  onShare,
}: GeneralInvitationRendererProps) {
  const title = (data.heroTitle || data.title || '').trim() || '행사에 초대합니다';
  const subtitle = (data.heroSubtitle || data.subtitle || '').trim();
  const intro = (data.content || data.introQuote || '').trim();
  const heroImage = (data.heroImage || '').trim();
  const eventWhen = (data.weddingDateTime || data.eventDate || '').trim();
  const place = (data.locationText || data.venueName || data.address || '').trim();
  const schedule = Array.isArray(data.schedule) ? data.schedule.filter(Boolean) : [];
  const galleryItems = getInvitationGalleryItems(data, { alt: '행사 갤러리' });
  const commentsOn = showComments ?? resolveCommentsEnabled(data);
  const rsvpSettings = getInvitationRsvpSettings(data, 'GENERAL');
  const rsvpOn = rsvpSettings.enabled || Boolean(showRsvp);
  const showAccounts = shouldShowAccountsSection(data, 'GENERAL');
  const hasLocation = Boolean(data.address || data.venueName || data.mapLat != null);

  const sections = getInvitationSections('GENERAL', {
    hasIntroduction: Boolean(intro),
    hasSchedule: schedule.length > 0 || Boolean(eventWhen),
    hasGallery: galleryItems.length > 0,
    hasLocation,
    hasAccounts: showAccounts,
    hasRsvp: rsvpOn,
    hasComments: commentsOn,
    hasShare: Boolean(onShare),
  });

  const show = (key: (typeof sections)[number]) => sections.includes(key);
  const showGalleryEmptyPlaceholder = Boolean(previewMode) && galleryItems.length === 0;

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-concept="GENERAL"
    >
      {show('hero') ? (
        <section
          className={styles.hero}
          data-testid="public-hero"
          data-section-id="hero"
          data-preview-section="hero"
        >
          {heroImage ? (
            <div className={styles.heroMedia}>
              <ImageWithFallback className={styles.heroImage} src={heroImage} alt="" loading="eager" />
              <div className={styles.heroScrim} aria-hidden />
            </div>
          ) : null}
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Event</p>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            {eventWhen ? <p className={styles.meta}>{eventWhen}</p> : null}
            {place ? <p className={styles.meta}>{place}</p> : null}
          </div>
        </section>
      ) : null}

      {show('introduction') ? (
        <section
          className={styles.section}
          data-testid="general-introduction"
          data-section-id="greeting"
          data-preview-section="greeting"
        >
          <h2 className={styles.sectionTitle}>행사 소개</h2>
          <div className={styles.body}>
            {asLines(intro).map((line, index) => (
              <p key={`intro-${index}`}>{line}</p>
            ))}
          </div>
        </section>
      ) : null}

      {show('schedule') ? (
        <section
          className={styles.section}
          data-testid="general-schedule"
          data-section-id="schedule"
          data-preview-section="schedule"
        >
          <h2 className={styles.sectionTitle}>행사 일정</h2>
          <ul className={styles.scheduleList}>
            {(schedule.length > 0 ? schedule : [eventWhen]).map((item, index) => (
              <li key={`schedule-${index}`}>{item}</li>
            ))}
          </ul>
          {place ? <p className={styles.meta}>{place}</p> : null}
        </section>
      ) : null}

      {show('gallery') ? (
        <GalleryCarousel
          items={galleryItems}
          sectionLabel="Gallery"
          tone="general"
          hintText="밀어서 더 많은 이미지 보기"
        />
      ) : showGalleryEmptyPlaceholder ? (
        <section
          aria-label="Gallery"
          data-testid="gallery-empty-placeholder"
          className={styles.section}
          data-section-id="gallery"
          data-preview-section="gallery"
          style={{ textAlign: 'center', opacity: 0.7 }}
        >
          <p style={{ margin: 0, fontSize: 13 }}>갤러리 이미지를 추가해 주세요</p>
        </section>
      ) : null}

      {show('location') ? (
        <section
          className={styles.locationSection}
          data-testid="general-location"
          data-section-id="location"
          data-preview-section="location"
        >
          <LocationMapSection
            sectionTitle="오시는 길"
            title={(data.venueName || data.locationText || '').trim()}
            address={(data.formattedAddress || data.address || '').trim()}
            detailAddress={(data.detailAddress || data.venueDetail || '').trim() || undefined}
            googlePlaceId={data.googlePlaceId}
            mapLat={data.mapLat}
            mapLng={data.mapLng}
            mapProvider={data.mapProvider}
            naverPlaceId={data.naverPlaceId}
            naverMapUrl={data.naverMapUrl}
            invitationData={data}
            mapImage={data.mapImage}
            previewMode={Boolean(previewMode)}
          />
        </section>
      ) : null}

      {show('account') ? (
        <InvitationAccountsSection
          accounts={data.accounts}
          conceptType="GENERAL"
          accountsTitle={data.accountsTitle}
        />
      ) : null}

      {show('rsvp') ? (
        <InvitationRsvpSection
          data={data}
          conceptType="GENERAL"
          invitationSlug={invitationSlug}
          previewMode={previewMode || !invitationSlug}
        />
      ) : null}

      {show('comments') ? (
        <InvitationCommentsSection
          invitationSlug={invitationSlug}
          conceptType="GENERAL"
          enabled
          titleOverride={(data.messagesTitle || '').trim() || undefined}
          previewMode={previewMode || !invitationSlug}
        />
      ) : null}

      {show('share') && onShare ? (
        <section
          className={styles.section}
          data-section-id="share"
          data-preview-section="share"
        >
          <button type="button" className={styles.shareBtn} onClick={onShare}>
            공유하기
          </button>
        </section>
      ) : (
        <section
          data-section-id="share"
          data-preview-section="share"
          aria-hidden
          style={{ height: 1, margin: 0, padding: 0, border: 0, overflow: 'hidden' }}
        />
      )}
    </div>
  );
}
