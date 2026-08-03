'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * WEDDING 05 — Romantic Garden
 * 아치 히어로 + 편지형 인사말 + 폴라로이드 갤러리.
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
import styles from './WeddingGardenInvitation.module.css';

function PersonCard({ person, offset }: { person: TemplatePerson; offset: boolean }) {
  return (
    <div className={`${styles.personCard} ${offset ? styles.personCardOffset : ''}`.trim()}>
      <div className={styles.personFrame}>
        <ImageWithFallback
          className={styles.personImage}
          src={person.image || null}
          alt=""
          fallback={<span className={styles.personInitial}>{person.name.slice(0, 1) || person.role}</span>}
        />
      </div>
      <p className={styles.personRole}>{person.role}</p>
      {person.name ? <p className={styles.personName}>{person.name}</p> : null}
      {person.parentsText ? <p className={styles.personMeta}>{person.parentsText}</p> : null}
      {person.phone ? (
        <a className={styles.personPill} href={toTelHref(person.phone)}>
          연락하기
        </a>
      ) : null}
    </div>
  );
}

export default function WeddingGardenInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '' } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-visual-template="WEDDING_05_GARDEN"
      data-concept={model.conceptType}
    >
      <section className={styles.hero} data-section-id="hero" data-preview-section="hero">
        {showHeroMedia ? (
          <InvitationReveal variant="blur">
            <div className={styles.arch}>
              <ImageWithFallback
                className={styles.archImage}
                src={model.heroImage || null}
                alt=""
                loading="eager"
                fallback={<div className={styles.archPlaceholder}>대표 이미지를 추가해 주세요</div>}
              />
            </div>
          </InvitationReveal>
        ) : null}
        <InvitationReveal variant="rise" delayMs={120}>
          <p className={styles.eyebrow}>우리 결혼합니다</p>
          <h1 className={styles.title}>{model.title}</h1>
          <span className={styles.leaf} aria-hidden />
          {model.dateText ? <p className={styles.heroDate}>{model.dateText}</p> : null}
          {model.venueName ? <p className={styles.heroVenue}>{model.venueName}</p> : null}
        </InvitationReveal>
      </section>

      {model.hasGreeting || flags.showEmptyPlaceholder ? (
        <section className={styles.letter} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="blur">
            <div className={styles.letterCard}>
              <p className={styles.sectionLabel}>초대의 말씀</p>
              {model.hasGreeting ? (
                model.greetingLines.map((line, index) => (
                  <p key={`greeting-${index}`} className={styles.letterLine}>
                    {line}
                  </p>
                ))
              ) : (
                <p className={styles.placeholder}>인사말을 입력해 주세요</p>
              )}
            </div>
          </InvitationReveal>
        </section>
      ) : null}

      {model.hasCouple ? (
        <section className={styles.people} data-section-id="couple" data-preview-section="couple">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>신랑 · 신부</p>
          </InvitationReveal>
          <div className={styles.peopleGrid}>
            {model.groom ? (
              <InvitationReveal variant="blur" delayMs={80}>
                <PersonCard person={model.groom} offset={false} />
              </InvitationReveal>
            ) : null}
            {model.bride ? (
              <InvitationReveal variant="blur" delayMs={200}>
                <PersonCard person={model.bride} offset />
              </InvitationReveal>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={styles.schedule} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="rise">
          <p className={styles.sectionLabel}>예식 일정</p>
          <p className={styles.scheduleDate}>{model.dateText || '일정을 입력해 주세요'}</p>
        </InvitationReveal>
        <InvitationReveal variant="fade" delayMs={120}>
          <TemplateDateGrid
            variant="garden"
            eventDate={data.eventDate}
            weddingDate={data.weddingDate}
            weddingDateTime={data.weddingDateTime}
            className={styles.dateGrid}
          />
        </InvitationReveal>
        {model.venueName ? (
          <InvitationReveal variant="rise" delayMs={200}>
            <p className={styles.ribbon}>{model.venueName}</p>
            {model.venueDetail ? <p className={styles.ribbonDetail}>{model.venueDetail}</p> : null}
          </InvitationReveal>
        ) : null}
      </section>

      {model.gallery.hasItems ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>우리의 순간</p>
          </InvitationReveal>
          <div className={styles.polaroidGrid}>
            {model.gallery.items.map((item, index) => (
              <button
                key={item.id || item.url}
                type="button"
                className={styles.polaroid}
                onClick={() => setLightboxIndex(index)}
                aria-label={`${index + 1}번째 사진 크게 보기`}
              >
                <span className={styles.polaroidFrame}>
                  <ImageWithFallback className={styles.polaroidImage} src={item.url} alt={item.alt} />
                </span>
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
          <LocationMapSection
            sectionTitle="오시는 길"
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
