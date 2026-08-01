'use client';
/* eslint-disable i18next/no-literal-string */

import InvitationCommentsSection from '@/src/features/comments/ui/InvitationCommentsSection';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import InvitationGallerySection from '@/src/templates/shared/InvitationGallerySection';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import { resolveCommentsEnabled } from '@/src/invitation/commentsSettings';
import { getInvitationGallerySettings } from '@/src/invitation/galleryDisplay';
import {
  resolveAccountEnabled,
  shouldShowAccountsSection,
} from '@/src/invitation/accountItems';
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

function uniqueScheduleLines(...candidates: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const candidate of candidates) {
    const value = (candidate || '').trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function PreviewPlaceholder({
  sectionId,
  testId,
  children,
}: {
  sectionId: string;
  testId: string;
  children: string;
}) {
  return (
    <section
      className={styles.section}
      data-section-id={sectionId}
      data-preview-section={sectionId}
      data-testid={testId}
      style={{ textAlign: 'center', opacity: 0.65 }}
    >
      <p style={{ margin: 0, fontSize: 13 }}>{children}</p>
    </section>
  );
}

/**
 * GENERAL 전용 presentation — Wedding couple/account 축의금 UI 금지.
 * Preview: 빈/OFF 섹션도 step 이동용 anchor 유지.
 * Public: 빈 placeholder 미노출.
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
  // 사용자 부제만 사용. heroSubtitle(mapper의 포맷 날짜)과 혼용하면 날짜가 두 번 보인다.
  const subtitle = (data.subtitle || '').trim();
  const introQuote = (data.introQuote || '').trim();
  const introBody = (data.content || '').trim();
  const hasIntro = Boolean(introQuote || introBody);
  const heroImage = (data.heroImage || '').trim();
  const eventWhen = (data.weddingDateTime || '').trim();
  const place = (data.locationText || data.venueName || data.address || '').trim();
  const scheduleRaw = Array.isArray(data.schedule) ? data.schedule.filter(Boolean) : [];
  const scheduleLines = uniqueScheduleLines(...scheduleRaw, eventWhen);
  const gallerySettings = getInvitationGallerySettings(data, { alt: '행사 갤러리' });
  const galleryItems = gallerySettings.images;
  const commentsOn = showComments ?? resolveCommentsEnabled(data);
  const rsvpSettings = getInvitationRsvpSettings(data, 'GENERAL');
  const rsvpOn = rsvpSettings.enabled || Boolean(showRsvp);
  const accountEnabled = resolveAccountEnabled(data, 'GENERAL');
  const showAccounts = shouldShowAccountsSection(data, 'GENERAL');
  const hasLocation = Boolean(data.address || data.venueName || data.mapLat != null);
  const hasSchedule = scheduleLines.length > 0;
  const musicEnabled = Boolean(data.music?.enabled);

  const showGalleryEmptyPlaceholder = Boolean(previewMode) && galleryItems.length === 0;
  const showIntroBlock = hasIntro || previewMode;
  const showScheduleBlock = hasSchedule || previewMode;
  const showLocationBlock = hasLocation || previewMode;
  const showAccountsBlock = showAccounts || previewMode;
  const showRsvpBlock = rsvpOn || previewMode;
  const showMusicBlock = true;
  const showShareBlock = true;

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-concept="GENERAL"
    >
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
        ) : previewMode ? (
          <div className={styles.heroMedia} data-testid="hero-empty-placeholder">
            <div className={styles.heroScrim} aria-hidden />
            <p className={styles.heroEmptyHint}>대표 이미지를 추가해 주세요</p>
          </div>
        ) : null}
        <div
          className={styles.heroContent}
          data-section-id="basic"
          data-preview-section="basic"
          data-testid="general-basic"
        >
          <p className={styles.eyebrow}>Event</p>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          {eventWhen ? <p className={styles.meta}>{eventWhen}</p> : null}
          {place ? <p className={styles.meta}>{place}</p> : null}
        </div>
      </section>

      {showIntroBlock ? (
        hasIntro ? (
          <section
            className={styles.section}
            data-testid="general-introduction"
            data-section-id="greeting"
            data-preview-section="greeting"
          >
            <h2 className={styles.sectionTitle}>행사 소개</h2>
            {introQuote ? <p className={styles.introQuote}>{introQuote}</p> : null}
            {introBody ? (
              <div className={styles.body}>
                {asLines(introBody).map((line, index) => (
                  <p key={`intro-${index}`}>{line}</p>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <PreviewPlaceholder sectionId="greeting" testId="general-introduction-placeholder">
            행사 소개를 입력해 주세요.
          </PreviewPlaceholder>
        )
      ) : null}

      {showScheduleBlock ? (
        hasSchedule ? (
          <section
            className={styles.section}
            data-testid="general-schedule"
            data-section-id="schedule"
            data-preview-section="schedule"
          >
            <h2 className={styles.sectionTitle}>행사 일정</h2>
            <ul className={styles.scheduleList}>
              {scheduleLines.map((item, index) => (
                <li key={`schedule-${index}`}>{item}</li>
              ))}
            </ul>
            {place ? <p className={styles.meta}>{place}</p> : null}
          </section>
        ) : (
          <PreviewPlaceholder sectionId="schedule" testId="general-schedule-placeholder">
            행사 일정을 입력해 주세요.
          </PreviewPlaceholder>
        )
      ) : null}

      {galleryItems.length > 0 ? (
        <InvitationGallerySection
          items={galleryItems}
          displayMode={gallerySettings.displayMode}
          sectionLabel="Gallery"
          tone="general"
          hintText="밀어서 더 많은 이미지 보기"
          lockBodyScroll={!previewMode}
        />
      ) : showGalleryEmptyPlaceholder ? (
        <PreviewPlaceholder sectionId="gallery" testId="gallery-empty-placeholder">
          갤러리 이미지를 추가해 주세요
        </PreviewPlaceholder>
      ) : null}

      {showLocationBlock ? (
        hasLocation ? (
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
        ) : (
          <PreviewPlaceholder sectionId="location" testId="general-location-placeholder">
            위치 정보를 입력해 주세요.
          </PreviewPlaceholder>
        )
      ) : null}

      {showAccountsBlock ? (
        showAccounts ? (
          <InvitationAccountsSection
            accounts={data.accounts}
            conceptType="GENERAL"
            accountsTitle={data.accountsTitle}
          />
        ) : previewMode ? (
          <PreviewPlaceholder sectionId="accounts" testId="invitation-accounts-placeholder">
            {accountEnabled
              ? '계좌 정보를 1개 이상 추가해 주세요.'
              : '참가비·계좌 정보가 사용되지 않습니다.'}
          </PreviewPlaceholder>
        ) : null
      ) : null}

      {showRsvpBlock ? (
        rsvpOn ? (
          <InvitationRsvpSection
            data={data}
            conceptType="GENERAL"
            invitationSlug={invitationSlug}
            previewMode={previewMode || !invitationSlug}
          />
        ) : previewMode ? (
          <PreviewPlaceholder sectionId="rsvp" testId="general-rsvp-placeholder">
            참석 여부 기능이 사용되지 않습니다.
          </PreviewPlaceholder>
        ) : null
      ) : null}

      {commentsOn ? (
        <InvitationCommentsSection
          invitationSlug={invitationSlug}
          conceptType="GENERAL"
          enabled
          titleOverride={(data.messagesTitle || '').trim() || undefined}
          previewMode={previewMode || !invitationSlug}
        />
      ) : null}

      {showMusicBlock ? (
        previewMode ? (
          musicEnabled ? (
            <section
              className={styles.section}
              data-section-id="music"
              data-preview-section="music"
              data-testid="general-music-preview"
              style={{ textAlign: 'center', opacity: 0.75 }}
            >
              <p style={{ margin: 0, fontSize: 13 }}>
                {(data.music?.title || data.music?.musicKey || '배경 음악').toString()}
              </p>
            </section>
          ) : (
            <PreviewPlaceholder sectionId="music" testId="general-music-placeholder">
              배경 음악이 사용되지 않습니다.
            </PreviewPlaceholder>
          )
        ) : (
          <section
            data-section-id="music"
            data-preview-section="music"
            aria-hidden
            style={{ height: 1, margin: 0, padding: 0, border: 0, overflow: 'hidden' }}
          />
        )
      ) : null}

      {showShareBlock ? (
        onShare ? (
          <section
            className={styles.section}
            data-section-id="share"
            data-preview-section="share"
          >
            <button type="button" className={styles.shareBtn} onClick={onShare}>
              공유하기
            </button>
          </section>
        ) : previewMode ? (
          <section
            className={styles.section}
            data-section-id="share"
            data-preview-section="share"
            data-testid="general-share-preview"
            style={{ opacity: 0.75 }}
          >
            <h2 className={styles.sectionTitle}>공유 설정</h2>
            <p className={styles.meta}>
              {(data.openGraph?.title || data.share?.ogTitle || title).toString()}
            </p>
            {(data.openGraph?.description || data.share?.ogDescription) ? (
              <p className={styles.meta}>
                {(data.openGraph?.description || data.share?.ogDescription || '').toString()}
              </p>
            ) : (
              <p className={styles.meta} style={{ opacity: 0.7 }}>
                공유 제목·설명을 설정해 주세요.
              </p>
            )}
          </section>
        ) : (
          <section
            data-section-id="share"
            data-preview-section="share"
            aria-hidden
            style={{ height: 1, margin: 0, padding: 0, border: 0, overflow: 'hidden' }}
          />
        )
      ) : null}

      {/* Editor Preview: 마지막 step(music/share)도 상단 정렬되도록 스크롤 여유 확보 */}
      {previewMode ? (
        <div
          aria-hidden
          data-testid="preview-scroll-spacer"
          style={{ height: '70vh', width: '100%', flexShrink: 0 }}
        />
      ) : null}
    </div>
  );
}
