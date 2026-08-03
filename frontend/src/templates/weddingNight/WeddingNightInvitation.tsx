'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * WEDDING 06 — Minimal Night
 * 다크 시네마틱 히어로 + 가로 필름 갤러리.
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
  toTelHref,
  type TemplatePerson,
  type VisualTemplateProps,
} from '@/src/templates/shared/templateInvitationModel';
import styles from './WeddingNightInvitation.module.css';

function ContactLine({ person }: { person: TemplatePerson }) {
  return (
    <div className={styles.contactLine}>
      <span className={styles.contactRole}>{person.role}</span>
      <span className={styles.contactName}>{person.name}</span>
      {person.phone ? (
        <a className={styles.contactLink} href={toTelHref(person.phone)}>
          연락하기
        </a>
      ) : null}
    </div>
  );
}

export default function WeddingNightInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '' } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-visual-template="WEDDING_06_NIGHT"
      data-concept={model.conceptType}
    >
      <section className={styles.hero} data-section-id="hero" data-preview-section="hero">
        {showHeroMedia ? (
          <div className={styles.heroMedia}>
            <ImageWithFallback
              className={styles.heroImage}
              src={model.heroImage || null}
              alt=""
              loading="eager"
              fallback={<div className={styles.heroPlaceholder}>대표 이미지를 추가해 주세요</div>}
            />
            <span className={styles.heroScrim} aria-hidden />
          </div>
        ) : null}
        <div className={styles.heroText}>
          <h1 className={styles.title}>{model.title}</h1>
          {model.dateParts ? (
            <p className={styles.heroDate}>
              {`${model.dateParts.year}. ${model.dateParts.month}. ${model.dateParts.day}`}
            </p>
          ) : null}
          {model.venueName ? <p className={styles.heroVenue}>{model.venueName}</p> : null}
        </div>
      </section>

      {model.hasGreeting || model.subtitle || flags.showEmptyPlaceholder ? (
        <section className={styles.intro} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="rise">
            {model.subtitle ? <p className={styles.introQuote}>{model.subtitle}</p> : null}
            <span className={styles.hairline} aria-hidden />
            {model.hasGreeting ? (
              model.greetingLines.map((line, index) => (
                <p key={`greeting-${index}`} className={styles.introLine}>
                  {line}
                </p>
              ))
            ) : (
              <p className={styles.placeholder}>인사말을 입력해 주세요</p>
            )}
          </InvitationReveal>
        </section>
      ) : null}

      {model.hasCouple ? (
        <section className={styles.couple} data-section-id="couple" data-preview-section="couple">
          <InvitationReveal variant="fade">
            <p className={styles.sectionLabel}>THE COUPLE</p>
            {model.groom ? <ContactLine person={model.groom} /> : null}
            {model.bride ? <ContactLine person={model.bride} /> : null}
          </InvitationReveal>
        </section>
      ) : null}

      {model.gallery.hasItems ? (
        <section className={styles.film} data-section-id="gallery" data-preview-section="gallery">
          <InvitationReveal variant="fade">
            <p className={styles.sectionLabel}>FILM</p>
          </InvitationReveal>
          <div className={styles.filmStrip}>
            {model.gallery.items.map((item, index) => (
              <button
                key={item.id || item.url}
                type="button"
                className={styles.filmCell}
                onClick={() => setLightboxIndex(index)}
                aria-label={`${index + 1}번째 사진 크게 보기`}
              >
                <ImageWithFallback className={styles.filmImage} src={item.url} alt={item.alt} />
              </button>
            ))}
          </div>
          <p className={styles.filmHint}>밀어서 더 많은 사진 보기</p>
        </section>
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.film} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>갤러리 이미지를 추가해 주세요</p>
        </section>
      ) : null}

      {model.hasLocation || flags.showEmptyPlaceholder ? (
        <section className={styles.location} data-section-id="location" data-preview-section="location">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>VENUE</p>
            {model.venueName ? <p className={styles.venueName}>{model.venueName}</p> : null}
            {model.venueDetail ? <p className={styles.venueDetail}>{model.venueDetail}</p> : null}
          </InvitationReveal>
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
            tone="dark"
            previewMode={flags.previewMode}
            transportTitle="교통 안내"
            transportInfo={model.transportInfo}
            parkingTitle="주차 안내"
            parkingInfo={model.parkingInfo}
          />
        </section>
      ) : null}

      <section className={styles.calendar} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="fade">
          <p className={styles.sectionLabel}>DATE</p>
          <p className={styles.calendarDate}>{model.dateText || '일정을 입력해 주세요'}</p>
        </InvitationReveal>
        <InvitationReveal variant="fade" delayMs={120}>
          <TemplateDateGrid
            variant="night"
            eventDate={data.eventDate}
            weddingDate={data.weddingDate}
            weddingDateTime={data.weddingDateTime}
            className={styles.dateGrid}
          />
        </InvitationReveal>
      </section>

      {model.showAccounts ? (
        <InvitationAccountsSection
          accounts={data.accounts}
          conceptType={model.conceptType}
          accountsTitle={data.accountsTitle}
          className={styles.accounts}
        />
      ) : flags.showEmptyPlaceholder ? (
        <section
          className={styles.accountsEmpty}
          data-section-id="accounts"
          data-preview-section="accounts"
        >
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

      <section data-section-id="music" data-preview-section="music" className={styles.anchor} aria-hidden />
      <section data-section-id="share" data-preview-section="share" className={styles.anchor} aria-hidden />

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
