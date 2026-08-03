'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * GENERAL 06 — Culture & Exhibition
 * 40/60 비대칭 히어로 + 포스터 스냅 갤러리 + 하단 공유 푸터.
 * Make 원본에는 본문 공유 섹션이 없어 서비스 공유 SSOT 를 푸터로 연결한다.
 */
import { useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import GalleryLightboxDialog from '@/src/templates/shared/GalleryLightboxDialog';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import TemplateDateGrid from '@/src/templates/shared/TemplateDateGrid';
import { InvitationReveal } from '@/src/templates/shared/motion/InvitationReveal';
import {
  buildTemplateInvitationModel,
  resolveTemplateRenderFlags,
  type VisualTemplateProps,
} from '@/src/templates/shared/templateInvitationModel';
import styles from './GeneralCultureInvitation.module.css';

const SHARE_DONE_MESSAGE = '링크가 복사되었습니다';
const SHARE_FAIL_MESSAGE = '링크를 복사하지 못했습니다';

async function copyCurrentUrl(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}

export default function GeneralCultureInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '', onShare, onKakaoShare } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [shareNotice, setShareNotice] = useState('');

  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;
  const infoRows = [
    { label: '일시', value: model.dateText },
    { label: '장소', value: model.venueName },
    { label: '안내', value: model.venueDetail },
  ].filter((row) => Boolean(row.value));

  /** TEMPLATE_PREVIEW 이거나 핸들러가 없으면 URL 복사 데모로 대체한다 */
  const runShare = (handler?: () => void) => {
    if (!flags.isTemplatePreview && handler) {
      handler();
      return;
    }
    void copyCurrentUrl().then((ok) => setShareNotice(ok ? SHARE_DONE_MESSAGE : SHARE_FAIL_MESSAGE));
  };

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-visual-template="GENERAL_06_CULTURE"
      data-concept={model.conceptType}
    >
      <section className={styles.hero} data-section-id="hero" data-preview-section="hero">
        <div className={styles.heroTitleCol}>
          <InvitationReveal variant="mask">
            <h1 className={styles.title}>{model.title}</h1>
          </InvitationReveal>
          {model.dateParts ? (
            <p className={styles.heroDate}>
              {`${model.dateParts.year}.${model.dateParts.month}.${model.dateParts.day}`}
            </p>
          ) : null}
        </div>
        <div className={styles.heroMediaCol}>
          {showHeroMedia ? (
            <InvitationReveal variant="wipe">
              <ImageWithFallback
                className={styles.heroImage}
                src={model.heroImage || null}
                alt=""
                loading="eager"
                fallback={<div className={styles.heroPlaceholder}>대표 이미지를 추가해 주세요</div>}
              />
            </InvitationReveal>
          ) : null}
        </div>
      </section>

      {model.subtitle || model.hasGreeting || flags.showEmptyPlaceholder ? (
        <section className={styles.quote} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="rise">
            {model.subtitle ? <p className={styles.quoteLead}>{model.subtitle}</p> : null}
            {model.hasGreeting ? (
              model.greetingLines.map((line, index) => (
                <p key={`greeting-${index}`} className={styles.quoteLine}>
                  {line}
                </p>
              ))
            ) : model.subtitle ? null : (
              <p className={styles.placeholder}>소개 문구를 입력해 주세요</p>
            )}
          </InvitationReveal>
        </section>
      ) : null}

      {infoRows.length > 0 || flags.showEmptyPlaceholder ? (
        <section className={styles.info} data-section-id="basic" data-preview-section="basic">
          <p className={styles.sectionNumber}>01 — INFORMATION</p>
          {infoRows.length > 0 ? (
            <dl className={styles.infoList}>
              {infoRows.map((row) => (
                <div key={row.label} className={styles.infoRow}>
                  <dt className={styles.infoLabel}>{row.label}</dt>
                  <dd className={styles.infoValue}>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.placeholder}>행사 정보를 입력해 주세요</p>
          )}
        </section>
      ) : null}

      <section className={styles.program} data-section-id="schedule" data-preview-section="schedule">
        <p className={styles.sectionNumber}>02 — PROGRAM</p>
        {model.scheduleLines.length > 0 ? (
          <ul className={styles.programList}>
            {model.scheduleLines.map((line, index) => (
              <li key={`schedule-${index}`}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.placeholder}>일정을 입력해 주세요</p>
        )}
        <InvitationReveal variant="fade" delayMs={100}>
          <TemplateDateGrid
            variant="culture"
            eventDate={data.eventDate}
            weddingDate={data.weddingDate}
            weddingDateTime={data.weddingDateTime}
            className={styles.dateGrid}
          />
        </InvitationReveal>
      </section>

      {model.gallery.hasItems ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.sectionNumber}>03 — POSTER</p>
          <div className={styles.posterStrip}>
            {model.gallery.items.map((item, index) => (
              <button
                key={item.id || item.url}
                type="button"
                className={styles.posterCell}
                onClick={() => setLightboxIndex(index)}
                aria-label={`${index + 1}번째 사진 크게 보기`}
              >
                <ImageWithFallback className={styles.posterImage} src={item.url} alt={item.alt} />
              </button>
            ))}
          </div>
        </section>
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>갤러리 이미지를 추가해 주세요</p>
        </section>
      ) : null}

      {model.hasLocation || flags.showEmptyPlaceholder ? (
        <section className={styles.location} data-section-id="location" data-preview-section="location">
          <p className={styles.sectionNumber}>04 — LOCATION</p>
          <LocationMapSection
            title={model.venueName}
            address={model.address}
            detailAddress={model.detailAddress || undefined}
            invitationData={data}
            googlePlaceId={data.googlePlaceId}
            mapLat={data.mapLat}
            mapLng={data.mapLng}
            mapProvider={data.mapProvider}
            naverPlaceId={data.naverPlaceId}
            naverMapUrl={data.naverMapUrl}
            mapImage={data.mapImage}
            tone="light"
            previewMode={flags.previewMode}
            transportTitle="교통 안내"
            transportInfo={model.transportInfo}
            parkingTitle="주차 안내"
            parkingInfo={model.parkingInfo}
          />
        </section>
      ) : null}

      {model.showAccounts ? (
        <div className={styles.ticket}>
          <p className={styles.sectionNumber}>05 — TICKET</p>
          <InvitationAccountsSection
            accounts={data.accounts}
            conceptType={model.conceptType}
            accountsTitle={data.accountsTitle}
            className={styles.accounts}
          />
        </div>
      ) : flags.showEmptyPlaceholder ? (
        <section
          className={styles.accountsEmpty}
          data-section-id="accounts"
          data-preview-section="accounts"
        >
          <p className={styles.sectionNumber}>05 — TICKET</p>
          <p className={styles.placeholder}>계좌 정보를 추가해 주세요</p>
        </section>
      ) : null}

      <InvitationRsvpSection
        data={data}
        conceptType={model.conceptType}
        invitationSlug={invitationSlug}
        previewMode={flags.previewMode}
        className={styles.rsvp}
      />

      <section className={styles.share} data-section-id="share" data-preview-section="share">
        <p className={styles.sectionNumber}>06 — SHARE</p>
        <p className={styles.shareLead}>이 초대장을 함께 나누어 주세요</p>
        <div className={styles.shareRow}>
          <button type="button" className={styles.shareButton} onClick={() => runShare(onShare)}>
            공유하기
          </button>
          <button
            type="button"
            className={`${styles.shareButton} ${styles.shareButtonKakao}`}
            onClick={() => runShare(onKakaoShare)}
          >
            카카오톡 공유
          </button>
        </div>
        {shareNotice ? (
          <p className={styles.shareNotice} role="status">
            {shareNotice}
          </p>
        ) : null}
      </section>

      <section data-section-id="music" data-preview-section="music" className={styles.anchor} aria-hidden />

      <GalleryLightboxDialog
        items={model.gallery.items}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
        lockBodyScroll={flags.isPublic}
      />
    </div>
  );
}
