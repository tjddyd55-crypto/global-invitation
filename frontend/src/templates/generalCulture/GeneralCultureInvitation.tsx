'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * GENERAL 06 — Culture & Exhibition
 * 40/60 비대칭 히어로 + 포스터 스냅 갤러리 + 하단 공유 푸터.
 * Make 원본에는 본문 공유 섹션이 없어 서비스 공유 SSOT 를 푸터로 연결한다.
 */
import { useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
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
import VisualTemplateGallery from '@/src/templates/visualGallery/VisualTemplateGallery';
import { invitationT } from '@/src/i18n/invitationT';
import styles from './GeneralCultureInvitation.module.css';

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
  const t = (key: string) => invitationT(model.locale, key);
  const [shareNotice, setShareNotice] = useState('');

  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;
  const infoRows = [
    { label: t('invitation.common.date'), value: model.dateText },
    { label: t('invitation.common.place'), value: model.venueName },
    { label: t('invitation.common.info'), value: model.venueDetail },
  ].filter((row) => Boolean(row.value));

  /** TEMPLATE_PREVIEW 이거나 핸들러가 없으면 URL 복사 데모로 대체한다 */
  const runShare = (handler?: () => void) => {
    if (!flags.isTemplatePreview && handler) {
      handler();
      return;
    }
    void copyCurrentUrl().then((ok) =>
      setShareNotice(ok ? t('invitation.share.copied') : t('invitation.share.copyFailed'))
    );
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
          {model.dateCompact ? <p className={styles.heroDate}>{model.dateCompact}</p> : null}
        </div>
        <div className={styles.heroMediaCol}>
          {showHeroMedia ? (
            <InvitationReveal variant="wipe">
              <ImageWithFallback
                className={styles.heroImage}
                src={model.heroImage || null}
                alt=""
                loading="eager"
                fallback={<div className={styles.heroPlaceholder}>{t('invitation.placeholder.hero')}</div>}
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
              <p className={styles.placeholder}>{t('invitation.placeholder.intro')}</p>
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
            <p className={styles.placeholder}>{t('invitation.placeholder.eventInfo')}</p>
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
          <p className={styles.placeholder}>{t('invitation.placeholder.schedule')}</p>
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
        <VisualTemplateGallery
          visualTemplateId="GENERAL_06_CULTURE"
          items={model.gallery.items}
          displayMode={model.gallery.displayMode}
          sectionLabel="03 — POSTER"
          labelClassName={styles.sectionNumber}
          lockBodyScroll={flags.isPublic}
        />
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>{t('invitation.placeholder.gallery')}</p>
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
            transportTitle={t('invitation.map.transport')}
            transportInfo={model.transportInfo}
            parkingTitle={t('invitation.map.parking')}
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
          <p className={styles.placeholder}>{t('invitation.placeholder.accounts')}</p>
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
        <p className={styles.shareLead}>{t('invitation.share.cultureLead')}</p>
        <div className={styles.shareRow}>
          <button type="button" className={styles.shareButton} onClick={() => runShare(onShare)}>
            {t('invitation.share.native')}
          </button>
          <button
            type="button"
            className={`${styles.shareButton} ${styles.shareButtonKakao}`}
            onClick={() => runShare(onKakaoShare)}
          >
            {t('invitation.share.kakaoAction')}
          </button>
        </div>
        {shareNotice ? (
          <p className={styles.shareNotice} role="status">
            {shareNotice}
          </p>
        ) : null}
      </section>

      <section data-section-id="music" data-preview-section="music" className={styles.anchor} aria-hidden />
    </div>
  );
}
