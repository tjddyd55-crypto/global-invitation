'use client';
/* eslint-disable i18next/no-literal-string */

import InvitationCommentsSection from '@/src/features/comments/ui/InvitationCommentsSection';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import GalleryCarousel from '@/src/templates/shared/GalleryCarousel';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import { resolveCommentsEnabled } from '@/src/invitation/commentsSettings';
import { getInvitationGalleryItems } from '@/src/invitation/galleryItems';
import { shouldShowAccountsSection } from '@/src/invitation/accountItems';
import { getInvitationSections } from '@/src/invitation/conceptPresentationConfig';
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
  const rsvpOn = showRsvp ?? Boolean(data.rsvpEnabled);
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

  return (
    <div className={styles.page} data-testid="general-invitation" data-concept="GENERAL">
      {show('hero') ? (
        <section className={styles.hero}>
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
        <section className={styles.section} data-testid="general-introduction">
          <h2 className={styles.sectionTitle}>행사 소개</h2>
          <div className={styles.body}>
            {asLines(intro).map((line, index) => (
              <p key={`intro-${index}`}>{line}</p>
            ))}
          </div>
        </section>
      ) : null}

      {show('schedule') ? (
        <section className={styles.section} data-testid="general-schedule">
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
        <div data-testid="general-gallery">
          <GalleryCarousel
            items={galleryItems}
            sectionLabel="Gallery"
            tone="general"
            hintText="밀어서 더 많은 이미지 보기"
          />
        </div>
      ) : null}

      {show('location') ? (
        <section className={styles.section} data-testid="general-location">
          <LocationMapSection
            sectionTitle="오시는 길"
            title={(data.venueName || data.locationText || '').trim()}
            address={(data.formattedAddress || data.address || '').trim()}
            detailAddress={(data.detailAddress || data.venueDetail || '').trim() || undefined}
            googlePlaceId={data.googlePlaceId}
            mapLat={data.mapLat}
            mapLng={data.mapLng}
            mapImage={data.mapImage}
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
        <section className={styles.section} data-testid="general-rsvp-hint">
          <h2 className={styles.sectionTitle}>참석 여부</h2>
          <p className={styles.bodyLine}>
            {previewMode
              ? '공개 페이지에서 참석 여부를 남길 수 있습니다.'
              : '아래에서 참석 여부를 알려 주세요.'}
          </p>
        </section>
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
        <section className={styles.section}>
          <button type="button" className={styles.shareBtn} onClick={onShare}>
            공유하기
          </button>
        </section>
      ) : null}
    </div>
  );
}
